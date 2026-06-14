from celery import Celery
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.grading_service import evaluate_submission

celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Konfigurasi Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
    worker_concurrency=2
)

@celery_app.task(name="tasks.process_submission_task")
def process_submission_task(submission_id: str):
    """Task asinkron Celery untuk memproses lembar jawaban"""
    print(f"[CELERY] Memulai pemrosesan untuk Submission: {submission_id}")
    db = SessionLocal()
    try:
        evaluate_submission(db, submission_id)
    finally:
        db.close()
    print(f"[CELERY] Selesai memproses Submission: {submission_id}")
