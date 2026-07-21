import pytest
from typing import Generator
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app

@pytest.fixture(scope="module")
def client() -> Generator:
    # Use standard TestClient
    with TestClient(app) as c:
        yield c

@pytest.fixture(autouse=True)
def mock_db():
    """
    Globally mock MongoDB collections to run offline.
    """
    with patch("app.core.database.get_users_collection") as mock_users, \
         patch("app.core.database.get_profiles_collection") as mock_profiles, \
         patch("app.core.database.get_interviews_collection") as mock_interviews, \
         patch("app.core.database.get_reports_collection") as mock_reports:
         
        # Configure AsyncMock methods for database transactions
        mock_users.return_value = MagicMock()
        mock_profiles.return_value = MagicMock()
        mock_interviews.return_value = MagicMock()
        mock_reports.return_value = MagicMock()
        
        yield {
            "users": mock_users.return_value,
            "profiles": mock_profiles.return_value,
            "interviews": mock_interviews.return_value,
            "reports": mock_reports.return_value
        }
