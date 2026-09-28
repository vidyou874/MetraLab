from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.errors import api_error, not_found
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserCreateRequest, UserResponse, UserUpdateRequest
from app.schemas.common import UserRole
from app.services.audit import record_audit_event

router = APIRouter(tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.email)))


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
) -> User:
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise api_error(409, "duplicate_email", "An account with this email already exists")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()
    record_audit_event(
        db,
        actor=actor,
        event_type="user.created",
        target_type="user",
        target_id=user.id,
        summary="User account created",
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise not_found("User")
    changes = payload.model_dump(exclude_none=True)
    if not changes:
        raise api_error(422, "no_changes", "At least one change is required")
    for field, value in changes.items():
        setattr(user, field, value)
    record_audit_event(
        db,
        actor=actor,
        event_type="user.updated",
        target_type="user",
        target_id=user.id,
        summary="User role or active status updated",
        before_after={"changed_fields": sorted(changes)},
    )
    db.commit()
    db.refresh(user)
    return user
