from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
from decimal import Decimal

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.workers.tasks import process_submission_task

router = APIRouter(prefix="/api/v1")

# ==================== OVERVIEW / STATS ====================

@router.get("/overview/stats")
def get_overview_stats(db: Session = Depends(get_db)):
    total_submissions = db.query(models.Submission).count()
    processing_submissions = db.query(models.Submission).filter(
        models.Submission.status.in_(["PROCESSING_OCR", "PROCESSING_GRADING"])
    ).count()
    completed_submissions = db.query(models.Submission).filter(
        models.Submission.status == "COMPLETED"
    ).count()
    
    # Hitung rata-rata nilai final (atau total_score) dari grading_results
    avg_score = db.query(func.avg(models.GradingResult.final_score)).scalar()
    avg_score = float(avg_score) if avg_score is not None else 0.0

    return {
        "total_submissions": total_submissions,
        "processing": processing_submissions,
        "completed": completed_submissions,
        "avg_score": round(avg_score, 1)
    }

@router.get("/overview/chart-data")
def get_chart_data(db: Session = Depends(get_db)):
    # Buat dummy chart data untuk visualisasi 24 jam terakhir
    # Di masa depan ini bisa memetakan volume submit real-time per jam
    data = []
    now = datetime.now()
    for i in range(7, -1, -1):
        hour_time = now - timedelta(hours=i*3)
        # Hitung data riil submission dalam interval waktu tersebut jika ada
        data.append({
            "time": hour_time.strftime("%H:%M"),
            "volume": int(10 + (i * 15) % 45) # dummy dynamic data
        })
    return data

@router.get("/overview/recent-errors")
def get_recent_errors(db: Session = Depends(get_db)):
    # Ambil logs bertipe FAILED
    logs = db.query(models.SystemLog).filter(
        models.SystemLog.event_type.like("%FAIL%")
    ).order_by(models.SystemLog.created_at.desc()).limit(5).all()
    
    return [
        {
            "id": log.id,
            "event_type": log.event_type,
            "message": log.message,
            "created_at": log.created_at
        } for log in logs
    ]


# ==================== WEBHOOK (GOOGLE SHEETS) ====================

@router.post("/webhook/submit", status_code=status.HTTP_202_ACCEPTED)
def accept_submission_webhook(payload: schemas.SubmissionWebhookPayload, db: Session = Depends(get_db)):
    # Cari active exam jika exam_id tidak dikirim
    exam_id = payload.exam_id
    if not exam_id:
        active_exam = db.query(models.Exam).filter(models.Exam.is_active == True).first()
        if not active_exam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Tidak ada ujian aktif ditemukan untuk menampung submission."
            )
        exam_id = active_exam.id

    # Simpan data submission baru
    db_submission = models.Submission(
        exam_id=exam_id,
        student_nim=payload.nim,
        student_name=payload.nama,
        student_email=payload.email,
        file_url=payload.file_url,
        status="QUEUED"
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    # Catat log sistem
    log = models.SystemLog(
        event_type="SUBMISSION_WEBHOOK_RECEIVED",
        message=f"Menerima submission baru dari webhook Google Sheet untuk NIM: {payload.nim} ({payload.nama})"
    )
    db.add(log)
    db.commit()

    # Kirim ke Celery Worker asinkron
    process_submission_task.delay(str(db_submission.id))

    return {"message": "Submission diterima dan sedang diproses dalam antrean", "submission_id": db_submission.id}


# ==================== COURSES ====================

@router.get("/courses", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

@router.post("/courses", response_model=schemas.CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


# ==================== EXAMS ====================

@router.get("/exams", response_model=List[schemas.ExamResponse])
def get_exams(course_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    query = db.query(models.Exam)
    if course_id:
        query = query.filter(models.Exam.course_id == course_id)
    return query.all()

@router.post("/exams", response_model=schemas.ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(exam: schemas.ExamCreate, db: Session = Depends(get_db)):
    db_exam = models.Exam(**exam.dict())
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    return db_exam


# ==================== RUBRICS ====================

@router.get("/exams/{exam_id}/rubrics", response_model=List[schemas.RubricResponse])
def get_exam_rubrics(exam_id: UUID, db: Session = Depends(get_db)):
    return db.query(models.Rubric).filter(models.Rubric.exam_id == exam_id).order_by(models.Rubric.question_number).all()

@router.post("/rubrics", response_model=schemas.RubricResponse, status_code=status.HTTP_201_CREATED)
def create_rubric(rubric: schemas.RubricCreate, db: Session = Depends(get_db)):
    db_rubric = models.Rubric(**rubric.dict())
    db.add(db_rubric)
    db.commit()
    db.refresh(db_rubric)
    return db_rubric


# ==================== SUBMISSIONS ====================

@router.get("/submissions", response_model=List[schemas.SubmissionDetailResponse])
def get_submissions(db: Session = Depends(get_db)):
    submissions = db.query(models.Submission).order_by(models.Submission.created_at.desc()).all()
    results = []
    for s in submissions:
        exam = db.query(models.Exam).filter(models.Exam.id == s.exam_id).first()
        course = db.query(models.Course).filter(models.Course.id == exam.course_id).first() if exam else None
        
        grading_result = None
        if s.grading_result:
            grading_result = schemas.GradingResultResponse.from_orm(s.grading_result)

        results.append(
            schemas.SubmissionDetailResponse(
                id=s.id,
                exam_id=s.exam_id,
                student_nim=s.student_nim,
                student_name=s.student_name,
                student_email=s.student_email,
                file_url=s.file_url,
                status=s.status,
                created_at=s.created_at,
                exam_title=exam.title if exam else "Unknown Exam",
                course_name=course.name if course else "Unknown Course",
                grading_result=grading_result
            )
        )
    return results

@router.get("/submissions/{submission_id}", response_model=schemas.SubmissionDetailResponse)
def get_submission_detail(submission_id: UUID, db: Session = Depends(get_db)):
    s = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    exam = db.query(models.Exam).filter(models.Exam.id == s.exam_id).first()
    course = db.query(models.Course).filter(models.Course.id == exam.course_id).first() if exam else None
    
    grading_result = None
    if s.grading_result:
        grading_result = schemas.GradingResultResponse.from_orm(s.grading_result)

    return schemas.SubmissionDetailResponse(
        id=s.id,
        exam_id=s.exam_id,
        student_nim=s.student_nim,
        student_name=s.student_name,
        student_email=s.student_email,
        file_url=s.file_url,
        status=s.status,
        created_at=s.created_at,
        exam_title=exam.title if exam else "Unknown Exam",
        course_name=course.name if course else "Unknown Course",
        grading_result=grading_result
    )

@router.post("/submissions/{submission_id}/process")
def trigger_process_submission(submission_id: UUID, db: Session = Depends(get_db)):
    s = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    s.status = "QUEUED"
    db.commit()
    
    # Memicu ulang task worker Celery
    process_submission_task.delay(str(s.id))
    return {"message": "Pemrosesan ulang submission berhasil dipicu", "status": "QUEUED"}


# ==================== GRADING RESULTS ====================

@router.patch("/submissions/{submission_id}/grading", response_model=schemas.GradingResultResponse)
def review_grading_result(
    submission_id: UUID,
    payload: schemas.GradingResultReview,
    db: Session = Depends(get_db)
):
    grading_result = db.query(models.GradingResult).filter(models.GradingResult.submission_id == submission_id).first()
    if not grading_result:
        raise HTTPException(status_code=404, detail="Hasil grading tidak ditemukan")
    
    # Ubah data grading sesuai review dosen
    # Map ScoreItem dict list ke JSONB
    scores_dict_list = [item.dict() for item in payload.scores_breakdown]
    
    grading_result.scores_breakdown = scores_dict_list
    grading_result.total_score = Decimal(str(payload.total_score))
    grading_result.overall_feedback = payload.overall_feedback
    grading_result.final_score = Decimal(str(payload.final_score))
    grading_result.is_reviewed = payload.is_reviewed
    db.commit()
    db.refresh(grading_result)

    # Kirim ulang email notifikasi perubahan nilai/feedback
    submission = db.query(models.Submission).filter(models.Submission.id == submission_id).first()
    exam = db.query(models.Exam).filter(models.Exam.id == submission.exam_id).first() if submission else None
    
    send_evaluation_email(
        to_email=submission.student_email,
        student_name=submission.student_name,
        exam_title=exam.title if exam else "Hasil Evaluasi",
        total_score=float(grading_result.final_score),
        overall_feedback=grading_result.overall_feedback,
        scores_breakdown=grading_result.scores_breakdown
    )

    return grading_result


# ==================== SYSTEM LOGS ====================

@router.get("/logs", response_model=List[schemas.SystemLogResponse])
def get_system_logs(db: Session = Depends(get_db)):
    return db.query(models.SystemLog).order_by(models.SystemLog.created_at.desc()).all()


# ==================== SEED DATA ====================

@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_database(db: Session = Depends(get_db)):
    # 1. Buat Course
    course1 = db.query(models.Course).filter(models.Course.code == "CS-301").first()
    if not course1:
        course1 = models.Course(
            code="CS-301",
            name="Pemrograman Web",
            lecturer_name="Dr. Aris Munandar"
        )
        db.add(course1)
        db.commit()
        db.refresh(course1)

    course2 = db.query(models.Course).filter(models.Course.code == "CS-202").first()
    if not course2:
        course2 = models.Course(
            code="CS-202",
            name="Basis Data",
            lecturer_name="Dr. Aris Setiawan"
        )
        db.add(course2)
        db.commit()
        db.refresh(course2)

    # 2. Buat Exam
    exam1 = db.query(models.Exam).filter(models.Exam.course_id == course1.id).first()
    if not exam1:
        exam1 = models.Exam(
            course_id=course1.id,
            title="Mid-Term Assessment: Frontend Basics",
            is_active=True
        )
        db.add(exam1)
        db.commit()
        db.refresh(exam1)

        # Buat Rubrics untuk Exam 1
        r1 = models.Rubric(
            exam_id=exam1.id,
            question_number=1,
            question_text="Define the Second Law of Thermodynamics.",
            answer_key="The total entropy of an isolated system can never decrease over time...",
            max_score=5,
            rubric_criteria=["entropy", "isolated system", "reversible"]
        )
        r2 = models.Rubric(
            exam_id=exam1.id,
            question_number=2,
            question_text="Calculate the efficiency of the heat engine.",
            answer_key="Efficiency = 1 - Tc/Th = 1 - 300/900 = 0.67...",
            max_score=5,
            rubric_criteria=["efficiency formulas", "T_c/T_h relationship", "result calculation"]
        )
        r3 = models.Rubric(
            exam_id=exam1.id,
            question_number=3,
            question_text="Explain the Carnot Cycle steps.",
            answer_key="1. Isothermal Expansion, 2. Adiabatic Expansion, 3. Isothermal Compression, 4. Adiabatic Compression.",
            max_score=10,
            rubric_criteria=["four steps list", "isothermal expansion", "adiabatic expansion", "compression cycles"]
        )
        db.add_all([r1, r2, r3])
        db.commit()

    exam2 = db.query(models.Exam).filter(models.Exam.course_id == course2.id).first()
    if not exam2:
        exam2 = models.Exam(
            course_id=course2.id,
            title="SQL Performance Tuning",
            is_active=True
        )
        db.add(exam2)
        db.commit()
        db.refresh(exam2)

        r4 = models.Rubric(
            exam_id=exam2.id,
            question_number=1,
            question_text="Explain the difference between index scan and index seek.",
            answer_key="Index seek traverses index tree, index scan scans all pages...",
            max_score=10,
            rubric_criteria=["tree traversal", "leaf nodes scan", "performance trade-offs"]
        )
        db.add(r4)
        db.commit()

    return {"message": "Database successfully seeded with courses, exams, and rubrics."}

