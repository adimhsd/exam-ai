import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:securepassword@db:5432/exam_db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "Exam System <no-reply@exam.adi-muhamad.my.id>")

    class Config:
        env_file = ".env"

settings = Settings()
