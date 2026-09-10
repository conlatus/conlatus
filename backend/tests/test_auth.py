import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.user import User


def test_registration_success(client: TestClient):
    """Verifies registering a new recruiter creates the user and company."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newrecruiter@company.com",
            "password": "SecurePassword123!",
            "full_name": "Jordan Lee",
            "company_name": "NextGen AI",
            "role": "recruiter",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "newrecruiter@company.com"
    assert data["user"]["role"] == "recruiter"


def test_registration_duplicate_email_rejected(client: TestClient, seed_test_data):
    """Verifies registration fails with 400 when email already exists."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@test.com",  # Already in seed_test_data
            "password": "anotherpassword",
            "full_name": "Imposter Admin",
            "role": "admin",
        },
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()


def test_login_success(client: TestClient, seed_test_data):
    """Verifies logging in with valid credentials yields access & refresh tokens."""
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "adminpass123",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "admin"


def test_login_wrong_password(client: TestClient, seed_test_data):
    """Verifies login fails with 401 when given an incorrect password."""
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "wrongpassword999",
        },
    )
    assert resp.status_code == 401
    assert "invalid email or password" in resp.json()["detail"].lower()


def test_login_nonexistent_user(client: TestClient):
    """Verifies login fails with 401 for unknown email address."""
    resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nobody@nowhere.com",
            "password": "somepassword",
        },
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_user_forbidden(client: TestClient, db_session: AsyncSession, seed_test_data):
    """Verifies de-activated user accounts are rejected with 403 Forbidden."""
    res = await db_session.execute(select(User).where(User.email == "recruiter@test.com"))
    user = res.scalar_one()
    user.is_active = False
    await db_session.commit()

    resp = client.post(
        "/api/v1/auth/login",
        json={
            "email": "recruiter@test.com",
            "password": "recruiterpass123",
        },
    )
    assert resp.status_code == 403
    assert "inactive" in resp.json()["detail"].lower()


def test_get_me_authenticated(client: TestClient, admin_headers):
    """Verifies /api/v1/auth/me returns current user profile when authenticated."""
    resp = client.get("/api/v1/auth/me", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_get_me_expired_token(client: TestClient, expired_token):
    """Verifies expired JWT tokens are rejected with 401 Unauthorized."""
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_get_me_tampered_token(client: TestClient, tampered_token):
    """Verifies tokens with invalid signatures are rejected with 401 Unauthorized."""
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )
    assert resp.status_code == 401


def test_get_me_missing_token(client: TestClient):
    """Verifies unauthenticated requests to protected endpoints return 401."""
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_token_refresh_flow(client: TestClient, seed_test_data):
    """Verifies exchanging a refresh token yields a fresh access token."""
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "adminpass123"},
    )
    refresh_tok = login_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_tok},
    )
    assert refresh_resp.status_code == 200
    new_data = refresh_resp.json()
    assert "access_token" in new_data
    assert new_data["token_type"] == "bearer"


def test_logout(client: TestClient):
    """Verifies logout endpoint executes cleanly."""
    resp = client.post("/api/v1/auth/logout")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Logged out successfully"
