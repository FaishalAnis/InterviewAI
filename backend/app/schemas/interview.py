from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class QuestionBase(BaseModel):
    id: str
    text: str
    category: str  # e.g., "technical", "coding", "behavioral", "system_design"
    difficulty: str  # "easy", "medium", "hard"
    expected_criteria: List[str] = []
    coding_metadata: Optional[Dict[str, Any]] = None  # test cases, templates if coding

class ResponseSubmit(BaseModel):
    question_id: str
    answer_text: str
    speaking_duration_seconds: Optional[float] = 0.0
    audio_url: Optional[str] = None
    webcam_metrics: Optional[Dict[str, Any]] = None  # eye contact, speaking speed, smile freq

class CodingResponseSubmit(BaseModel):
    question_id: str
    code: str
    language: str
    execution_time_ms: Optional[float] = 0.0
    memory_usage_bytes: Optional[int] = 0
    passed_test_cases: int
    total_test_cases: int
    status: str  # "accepted", "runtime_error", "wrong_answer", "time_limit_exceeded"

class InterviewCreate(BaseModel):
    interview_type: str  # "Software Engineering", "Frontend", "Backend", "Full Stack", "Data Science", "AI/ML", "Product Manager", "HR Interview", "Behavioral Interview"
    difficulty: str = "Medium"  # "Easy", "Medium", "Hard"
    mode: str = "voice"  # "text", "voice", "video", "coding"
    resume_id: Optional[str] = None
    job_description_text: Optional[str] = None

class InterviewResponse(BaseModel):
    id: str
    user_id: str
    interview_type: str
    difficulty: str
    mode: str
    status: str  # "started", "in_progress", "completed"
    questions: List[QuestionBase]
    current_question_index: int
    created_at: datetime

    class Config:
        populate_by_name = True

class InterviewInDB(InterviewCreate):
    id: str = Field(alias="_id")
    user_id: str
    status: str = "started"
    questions: List[QuestionBase] = []
    responses: List[Dict[str, Any]] = []
    current_question_index: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
