"""Create an initial allowlisted user without a shared default credential."""

import argparse
import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.common import UserRole


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a MetraLab user")
    parser.add_argument("email")
    parser.add_argument(
        "--role", choices=[role.value for role in UserRole], default=UserRole.TECHNICIAN.value
    )
    args = parser.parse_args()
    password = getpass.getpass("Temporary password: ")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters")

    with SessionLocal() as db:
        email = args.email.lower()
        if db.scalar(select(User.id).where(User.email == email)) is not None:
            raise SystemExit("A user with this email already exists")
        db.add(
            User(email=email, password_hash=hash_password(password), role=args.role, is_active=True)
        )
        db.commit()


if __name__ == "__main__":
    main()
