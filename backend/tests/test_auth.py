from fastapi.testclient import TestClient

from tests.conftest import sign_in


def test_login_sets_session_and_returns_current_user(client: TestClient) -> None:
    sign_in(client, "tech@example.com")

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "tech@example.com"
    assert response.json()["role"] == "Technician"


def test_login_does_not_disclose_unknown_account(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"email": "unknown@example.com", "password": "correct-horse-battery"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


def test_login_fallback_from_user_csv_provisions_user(client: TestClient) -> None:
    # school@science-lab.edu is defined in user.csv with default password 123
    response = client.post(
        "/api/auth/login",
        json={"email": "school@science-lab.edu", "password": "123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "school@science-lab.edu"
    assert data["role"] == "Technician"

    # Subsequent login works directly from database
    response2 = client.post(
        "/api/auth/login",
        json={"email": "school@science-lab.edu", "password": "123"},
    )
    assert response2.status_code == 200


def test_get_available_accounts(client: TestClient) -> None:
    response = client.get("/api/auth/accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) >= 5
    emails = [a["email"] for a in accounts]
    assert "admin@metralab.local" in emails
    assert "school@science-lab.edu" in emails
