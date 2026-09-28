from collections.abc import Callable

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import api_error, forbidden
from app.core.security import read_session_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import UserRole


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(settings.session_cookie_name)
    user_id = read_session_token(token) if token else None
    if user_id is None:
        raise api_error(401, "unauthenticated", "Authentication is required")

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise api_error(401, "unauthenticated", "Authentication is required")
    return user


def require_roles(*roles: UserRole) -> Callable:
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise forbidden()
        return current_user

    return dependency
