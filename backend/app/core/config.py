import os
from typing import List, Optional
from pydantic import AnyHttpUrl, BeforeValidator, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Annotated

def parse_cors(v: str | List[str]) -> List[str]:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list):
        return v
    return ["*"]

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "InterviewAI"
    
    # Security
    SECRET_KEY: str = "supersecretkeychangeinproduction1234567890"
    REFRESH_SECRET_KEY: str = "superrefreshsecretkeychangeinproduction0987654321"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: Annotated[
        List[str], BeforeValidator(parse_cors)
    ] = ["*"]

    # Database
    MONGODB_URL: str = "mongodb://mongodb:27017"
    DATABASE_NAME: str = "interviewai"
    
    # Redis & Celery
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # AI Configurations
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    WHISPER_MODEL: str = "base"
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # First Superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@interviewai.com"
    FIRST_SUPERUSER_PASSWORD: str = "AdminPassword123!"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

settings = Settings()
