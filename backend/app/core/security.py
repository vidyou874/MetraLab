from datetime import UTC, datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import settings

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_session_token(user_id: int) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.session_expiry_minutes)
    return jwt.encode(
        {"sub": str(user_id), "exp": expires_at}, settings.session_secret, algorithm="HS256"
    )


def read_session_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.session_secret, algorithms=["HS256"])
        subject = payload.get("sub")
        return int(subject) if subject else None
    except (JWTError, ValueError):
        return None
