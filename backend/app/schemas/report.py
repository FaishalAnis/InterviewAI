from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScoreBreakdown(BaseModel):
    overall: float = 0.0
    communication: float = 0.0
    technical: float = 0.0
    problem_solving: float = 0.0
    confidence: float = 0.0
    grammar: float = 0.0
    vocabulary: float = 0.0
    body_language: float = 0.0
    speaking_speed: float = 0.0
    response_quality: float = 0.0
    depth_of_knowledge: float = 0.0

class QuestionEvaluation(BaseModel):
    question_id: str
    question_text: str
    user_answer: str
    score: float
    feedback: str
    strengths: List[str] = []
    weaknesses: List[str] = []
    suggested_answer: str

class TimelineMetric(BaseModel):
    label: str  # e.g. "Q1", "Q2" or times
    value: float

class ReportBase(BaseModel):
    interview_id: str
    user_id: str
    summary: str
    scores: ScoreBreakdown
    question_evaluations: List[QuestionEvaluation] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    mistakes: List[str] = []
    recommended_topics: List[str] = []
    recommended_resources: List[str] = []
    confidence_timeline: List[TimelineMetric] = []
    speaking_speed_timeline: List[TimelineMetric] = []
    actionable_improvement_plan: List[str] = []
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReportResponse(ReportBase):
    id: str

    class Config:
        populate_by_name = True
