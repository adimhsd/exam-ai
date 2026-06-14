from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import date, datetime
from typing import List, Optional, Dict, Any

# Course Schemas
class CourseBase(BaseModel):
    code: str
    name: str
    lecturer_name: str

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: UUID

    class Config:
        from_attributes = True

# Exam Schemas
class ExamBase(BaseModel):
    title: str
    date: date
    is_active: bool = True

class ExamCreate(ExamBase):
    course_id: UUID

class ExamResponse(ExamBase):
    id: UUID
    course_id: UUID
    submission_count: Optional[int] = 0
    avg_score: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Rubric Schemas
class RubricBase(BaseModel):
    question_number: int
    question_text: str
    answer_key: str
    max_score: int
    rubric_criteria: Optional[List[str]] = None

class RubricCreate(RubricBase):
    exam_id: UUID

class RubricResponse(RubricBase):
    id: UUID
    exam_id: UUID

    class Config:
        from_attributes = True


class RubricUpdate(BaseModel):
    question_number: Optional[int] = None
    question_text: Optional[str] = None
    answer_key: Optional[str] = None
    max_score: Optional[int] = None
    rubric_criteria: Optional[List[str]] = None

# Submission Schemas
class SubmissionBase(BaseModel):
    student_nim: str
    student_name: str
    student_email: EmailStr
    file_url: str

class SubmissionCreate(SubmissionBase):
    exam_id: UUID

class SubmissionResponse(SubmissionBase):
    id: UUID
    exam_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Google Spreadsheet Webhook Payload
class SubmissionWebhookPayload(BaseModel):
    timestamp: str
    email: EmailStr
    nama: str
    nim: str
    file_url: str
    exam_id: Optional[UUID] = None # Jika exam_id tidak disertakan, bisa dicari exam_active pertama

# Grading Result Schemas
class ScoreItem(BaseModel):
    question_number: int
    score: float
    max_score: float
    criteria_met: List[str]
    feedback: str

class GradingResultResponse(BaseModel):
    id: UUID
    submission_id: UUID
    raw_ocr_text: Optional[str] = None
    scores_breakdown: Optional[List[ScoreItem]] = None
    total_score: Optional[float] = None
    overall_feedback: Optional[str] = None
    confidence_score: Optional[float] = None
    is_reviewed: bool
    final_score: Optional[float] = None

    class Config:
        from_attributes = True

class GradingResultReview(BaseModel):
    scores_breakdown: List[ScoreItem]
    total_score: float
    overall_feedback: str
    final_score: float
    is_reviewed: bool = True

# System Log Schemas
class SystemLogResponse(BaseModel):
    id: UUID
    event_type: str
    message: str
    token_used: int
    estimated_cost: float
    created_at: datetime

    class Config:
        from_attributes = True

# Combined Submission Detail (with grading result and exam context)
class SubmissionDetailResponse(SubmissionResponse):
    exam_title: str
    course_name: str
    grading_result: Optional[GradingResultResponse] = None

    class Config:
        from_attributes = True


# Auth and User Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    user_email: str
    user_role: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class SubmissionRegradePayload(BaseModel):
    raw_ocr_text: str

