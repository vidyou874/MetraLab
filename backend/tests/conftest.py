from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.session import Base, get_db
from app.main import app
from app.models import User
from app.schemas.common import UserRole


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = testing_session()
    session.add_all(
        [
            User(
                email="admin@example.com",
                password_hash=hash_password("correct-horse-battery"),
                role=UserRole.ADMINISTRATOR,
                is_active=True,
            ),
            User(
                email="tech@example.com",
                password_hash=hash_password("correct-horse-battery"),
                role=UserRole.TECHNICIAN,
                is_active=True,
            ),
            User(
                email="reviewer@example.com",
                password_hash=hash_password("correct-horse-battery"),
                role=UserRole.REVIEWER,
                is_active=True,
            ),
        ]
    )
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def sign_in(client: TestClient, email: str) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "correct-horse-battery"},
    )
    assert response.status_code == 200
