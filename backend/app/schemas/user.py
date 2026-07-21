from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    role: str = "user"  # "user" or "admin"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class ProfileBase(BaseModel):
    user_id: str
    skills: List[str] = []
    experience_years: float = 0.0
    education: List[str] = []
    projects: List[str] = []
    avatar_url: Optional[str] = None
    streak: int = 0
    last_interview_date: Optional[datetime] = None

class ProfileUpdate(BaseModel):
    skills: Optional[List[str]] = None
    experience_years: Optional[float] = None
    education: Optional[List[str]] = None
    projects: Optional[List[str]] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_verified: bool = False
    verification_token: Optional[str] = None

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_verified: bool

    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None
