from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=3, max_length=256)


class AvailableAccount(BaseModel):
    email: str
    role: str
    full_name: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool


class UserCreateRequest(LoginRequest):
    role: UserRole = UserRole.TECHNICIAN


class UserUpdateRequest(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
