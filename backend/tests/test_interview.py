import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.services.code_sandbox import code_sandbox

@pytest.mark.asyncio
async def test_python_code_sandbox():
    code = """
def add(a, b):
    return a + b
"""
    test_cases = [
        {"input": "[1, 2]", "expected": "3"},
        {"input": "[10, -5]", "expected": "5"}
    ]
    result = await code_sandbox.execute_code(code, "python", test_cases)
    assert result["status"] == "accepted"
    assert result["passed_test_cases"] == 2
    assert result["total_test_cases"] == 2

@patch("app.repositories.interview.InterviewRepository.create", new_callable=AsyncMock)
@patch("app.services.ai_service.AIService.generate_questions", new_callable=AsyncMock)
def test_create_interview(mock_generate_questions, mock_create_interview, client: TestClient):
    # Mock current user injection
    mock_user = {
        "id": "user_id_123",
        "email": "user@example.com",
        "role": "user",
        "is_active": True
    }
    
    mock_generate_questions.return_value = [
        {"id": "q1", "text": "Question 1?", "category": "technical", "difficulty": "Medium"}
    ]
    
    mock_create_interview.return_value = {
        "id": "interview_id_123",
        "user_id": "user_id_123",
        "interview_type": "Backend",
        "questions": [{"id": "q1", "text": "Question 1?", "category": "technical", "difficulty": "Medium"}],
        "responses": [],
        "current_question_index": 0
    }
    
    with patch("app.api.endpoints.interview.get_current_user", return_value=mock_user):
        payload = {
            "interview_type": "Backend",
            "difficulty": "Medium",
            "mode": "text"
        }
        response = client.post("/api/v1/interview/", json=payload)
        assert response.status_code == 200
        assert response.json()["interview_type"] == "Backend"
