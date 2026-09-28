import csv
from pathlib import Path

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.core.errors import api_error
from app.core.security import create_session_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AvailableAccount, LoginRequest, UserResponse

router = APIRouter(tags=["auth"])


def _get_csv_users() -> list[dict[str, str]]:
    candidate_paths = [
        Path.home() / "user.csv",
        Path("/home/aryan/user.csv"),
        Path.cwd() / "user.csv",
        Path(__file__).resolve().parents[3] / "user.csv",
    ]
    for path in candidate_paths:
        if path.exists() and path.is_file():
            try:
                with path.open("r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    users: list[dict[str, str]] = []
                    for row in reader:
                        email = (row.get("email") or "").strip().lower()
                        if email:
                            users.append(
                                {
                                    "email": email,
                                    "role": (row.get("role") or "Technician").strip(),
                                    "full_name": (
                                        row.get("full_name") or email.split("@")[0]
                                    ).strip(),
                                    "password": (row.get("password") or "123").strip(),
                                }
                            )
                    if users:
                        return users
            except Exception:
                continue
    return []


@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    email_clean = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email_clean))

    if user is None:
        csv_users = _get_csv_users()
        matching = next((u for u in csv_users if u["email"] == email_clean), None)
        if matching is None:
            raise api_error(401, "invalid_credentials", "Invalid email or password")

        expected_pw = matching.get("password", "123")
        if payload.password != expected_pw:
            raise api_error(401, "invalid_credentials", "Invalid email or password")

        # Provision into database so future logins authenticate directly against DB
        user = User(
            email=email_clean,
            password_hash=hash_password(payload.password),
            role=matching["role"],
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.is_active or user.password_hash is None:
            raise api_error(401, "invalid_credentials", "Invalid email or password")
        if not verify_password(payload.password, user.password_hash):
            raise api_error(401, "invalid_credentials", "Invalid email or password")

    response.set_cookie(
        key=settings.session_cookie_name,
        value=create_session_token(user.id),
        httponly=True,
        secure=settings.environment != "development",
        samesite="lax",
        max_age=settings.session_expiry_minutes * 60,
    )
    return user


@router.post("/logout", status_code=204)
def logout(response: Response) -> Response:
    response.delete_cookie(settings.session_cookie_name, httponly=True, samesite="lax")
    return response


@router.get("/me", response_model=UserResponse)
def current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("/accounts", response_model=list[AvailableAccount])
def get_available_accounts() -> list[dict[str, str]]:
    users = _get_csv_users()
    return [{"email": u["email"], "role": u["role"], "full_name": u["full_name"]} for u in users]
