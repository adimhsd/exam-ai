import uuid
from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, ForeignKey, Numeric, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    lecturer_name = Column(String(255), nullable=False)

    exams = relationship("Exam", back_populates="course", cascade="all, delete-orphan")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    date = Column(Date, nullable=False, default=func.current_date())
    is_active = Column(Boolean, default=True)

    course = relationship("Course", back_populates="exams")
    rubrics = relationship("Rubric", back_populates="exam", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="exam", cascade="all, delete-orphan")

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    answer_key = Column(Text, nullable=False)
    max_score = Column(Integer, nullable=False)
    rubric_criteria = Column(JSON, nullable=True) # rubrik kriteria poin penilaian

    exam = relationship("Exam", back_populates="rubrics")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    student_nim = Column(String(50), nullable=False, index=True)
    student_name = Column(String(255), nullable=False)
    student_email = Column(String(255), nullable=False)
    file_url = Column(String(1000), nullable=False)
    status = Column(String(50), default="QUEUED") # QUEUED, PROCESSING_OCR, PROCESSING_GRADING, COMPLETED, FAILED
    created_at = Column(DateTime, default=func.now())

    exam = relationship("Exam", back_populates="submissions")
    grading_result = relationship("GradingResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class GradingResult(Base):
    __tablename__ = "grading_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_ocr_text = Column(Text, nullable=True)
    scores_breakdown = Column(JSON, nullable=True) # detail nilai per soal
    total_score = Column(Numeric(5, 2), nullable=True)
    overall_feedback = Column(Text, nullable=True)
    confidence_score = Column(Numeric(5, 2), nullable=True)
    is_reviewed = Column(Boolean, default=False)
    final_score = Column(Numeric(5, 2), nullable=True)

    submission = relationship("Submission", back_populates="grading_result")

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    message = Column(Text, nullable=False)
    token_used = Column(Integer, default=0)
    estimated_cost = Column(Numeric(10, 5), default=0.0)
    created_at = Column(DateTime, default=func.now())
