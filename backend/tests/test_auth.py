import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@patch("app.repositories.user.UserRepository.get_by_email", new_callable=AsyncMock)
@patch("app.repositories.user.UserRepository.create_user", new_callable=AsyncMock)
def test_signup(mock_create_user, mock_get_by_email, client: TestClient):
    mock_get_by_email.return_value = None
    mock_create_user.return_value = {
        "id": "mock_id",
        "email": "test@example.com",
        "full_name": "Test User",
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "created_at": "2026-07-21T00:00:00"
    }

    payload = {
        "email": "test@example.com",
        "full_name": "Test User",
        "password": "strongpassword123",
        "role": "user",
        "is_active": True,
        "is_superuser": False
    }
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    assert response.json()["id"] == "mock_id"

@patch("app.repositories.user.UserRepository.get_by_email", new_callable=AsyncMock)
def test_login_wrong_credentials(mock_get_by_email, client: TestClient):
    mock_get_by_email.return_value = None
    
    payload = {
        "email": "wrong@example.com",
        "password": "incorrectpassword"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 400
    assert "Incorrect email or password" in response.json()["detail"]
