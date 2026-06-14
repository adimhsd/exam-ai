import os
import json
import base64
import urllib.request
import tempfile
from decimal import Decimal
import fitz # PyMuPDF
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Submission, GradingResult, Rubric, Exam, SystemLog
from app.services.resend_service import send_evaluation_email

def download_file(url: str, dest_path: str):
    """Download file dari URL ke path tujuan lokal"""
    # Jika path lokal yang valid dikirim sebagai file_url (untuk simulasi/pengujian)
    if os.path.exists(url):
        import shutil
        shutil.copy(url, dest_path)
        return
        
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        with open(dest_path, 'wb') as out_file:
            out_file.write(response.read())

def render_pdf_to_images(pdf_path: str) -> list:
    """Merender halaman PDF menjadi bytes PNG"""
    images_bytes = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            images_bytes.append(pix.tobytes("png"))
    except Exception as e:
        print(f"Error rendering PDF: {e}")
        # Jika gagal (misal file korup atau bukan PDF), buat halaman dummy bergambar kosong
        # Di sini kita abaikan atau lempar kembali exception agar ditangani di atas
        raise e
    return images_bytes

def perform_vision_ocr(image_bytes: bytes) -> str:
    """Mengirim halaman gambar ke Vision LLM untuk mengekstrak teks"""
    if not settings.OPENAI_API_KEY:
        print("OPENAI_API_KEY tidak dikonfigurasi. Menggunakan mock OCR.")
        return "[MOCK OCR RESULT] Mahasiswa menjawab soal Hukum Termodinamika II dengan benar..."

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    prompt = (
        "Extract and transcribe all handwritten and typed text from this exam sheet page in Indonesian. "
        "Keep it verbatim and structured. Identify question numbers and answer content clearly."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        print(f"Error calling OpenAI Vision: {e}")
        raise e

def evaluate_grading_ai(raw_ocr_text: str, rubrics: list) -> dict:
    """Melakukan penilaian jawaban (scoring & feedback) berdasarkan teks OCR dan rubrik"""
    if not settings.OPENAI_API_KEY:
        print("OPENAI_API_KEY tidak dikonfigurasi. Menggunakan mock grading.")
        # Buat mock grading response berdasarkan rubrik
        scores = []
        total_score = 0.0
        for rubric in rubrics:
            max_s = float(rubric.max_score)
            score = max_s - 0.5 if max_s > 1.0 else max_s
            total_score += score
            scores.append({
                "question_number": rubric.question_number,
                "score": score,
                "max_score": max_s,
                "criteria_met": ["Menyebutkan definisi dasar", "Formula tepat"],
                "feedback": f"Jawaban untuk soal #{rubric.question_number} sangat baik."
            })
        return {
            "scores": scores,
            "total_score": total_score,
            "overall_feedback": "Pemahaman konsep mahasiswa secara keseluruhan sangat baik.",
            "confidence_score": 0.95
        }

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    rubric_str = ""
    for r in rubrics:
        rubric_str += (
            f"Nomor Soal: {r.question_number}\n"
            f"Teks Pertanyaan: {r.question_text}\n"
            f"Kunci Jawaban: {r.answer_key}\n"
            f"Nilai Maksimum: {r.max_score}\n"
            f"Kriteria Penilaian: {r.rubric_criteria}\n"
            f"---------------------------------\n"
        )

    system_prompt = (
        "Anda adalah asisten dosen akademik yang bertugas menilai jawaban ujian mahasiswa (essay) berdasarkan "
        "kunci jawaban dan rubrik yang disediakan. Bandingkan hasil transkripsi OCR jawaban mahasiswa dengan "
        "kunci jawaban serta rubrik yang diberikan. Berikan penilaian objektif dan buat output dalam format JSON valid "
        "dengan struktur kunci berikut:\n"
        "{\n"
        "  \"scores\": [\n"
        "    {\n"
        "      \"question_number\": 1,\n"
        "      \"score\": 4.5,\n"
        "      \"max_score\": 5.0,\n"
        "      \"criteria_met\": [\"menyebutkan kata kunci A\", \"penjelasan logis\"],\n"
        "      \"feedback\": \"penjelasan umpan balik untuk soal ini\"\n"
        "    }\n"
        "  ],\n"
        "  \"total_score\": 18.5,\n"
        "  \"overall_feedback\": \"umpan balik keseluruhan ujian\",\n"
        "  \"confidence_score\": 0.92\n"
        "}"
    )

    user_prompt = (
        f"Berikut adalah Rubrik & Kunci Jawaban:\n{rubric_str}\n\n"
        f"Berikut adalah hasil transkripsi OCR jawaban mahasiswa:\n{raw_ocr_text}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0
        )
        result_json = response.choices[0].message.content or "{}"
        return json.loads(result_json)
    except Exception as e:
        print(f"Error calling OpenAI Text Grading: {e}")
        raise e

def evaluate_submission(db: Session, submission_id: str):
    """Pipeline penuh Celery Worker untuk pemrosesan PDF -> OCR -> Grading -> DB -> Email"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        print(f"Submission {submission_id} tidak ditemukan.")
        return

    # 1. Update status -> PROCESSING_OCR
    submission.status = "PROCESSING_OCR"
    db.commit()

    temp_pdf = None
    try:
        # Buat temporary file untuk menyimpan PDF
        temp_pdf = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        temp_pdf_path = temp_pdf.name
        temp_pdf.close()

        # Download PDF dari URL
        download_file(submission.file_url, temp_pdf_path)

        # Render PDF ke halaman gambar
        pages_bytes = render_pdf_to_images(temp_pdf_path)

        # Transkripsi setiap halaman secara bertahap menggunakan Vision LLM
        transcripts = []
        for i, img_bytes in enumerate(pages_bytes):
            print(f"Melakukan OCR untuk Submission {submission_id} Halaman {i+1}...")
            page_text = perform_vision_ocr(img_bytes)
            transcripts.append(f"--- Halaman {i+1} ---\n{page_text}")

        raw_ocr_text = "\n\n".join(transcripts)

        # 2. Update status -> PROCESSING_GRADING
        submission.status = "PROCESSING_GRADING"
        db.commit()

        # Ambil rubrik untuk ujian ini
        rubrics = db.query(Rubric).filter(Rubric.exam_id == submission.exam_id).order_by(Rubric.question_number).all()

        # Panggil LLM untuk grading
        grading_data = evaluate_grading_ai(raw_ocr_text, rubrics)

        # 3. Simpan hasil grading ke basis data
        grading_result = db.query(GradingResult).filter(GradingResult.submission_id == submission_id).first()
        if not grading_result:
            grading_result = GradingResult(submission_id=submission_id)
            db.add(grading_result)

        grading_result.raw_ocr_text = raw_ocr_text
        grading_result.scores_breakdown = grading_data.get("scores", [])
        grading_result.total_score = Decimal(str(grading_data.get("total_score", 0.0)))
        grading_result.overall_feedback = grading_data.get("overall_feedback", "")
        grading_result.confidence_score = Decimal(str(grading_data.get("confidence_score", 1.0)))
        grading_result.is_reviewed = False
        grading_result.final_score = grading_result.total_score

        submission.status = "COMPLETED"
        db.commit()

        # Tambahkan log sistem sukses
        log = SystemLog(
            event_type="SUBMISSION_PROCESSING_SUCCESS",
            message=f"Sukses memproses lembar jawaban mahasiswa {submission.student_name} (NIM: {submission.student_nim})",
            token_used=1500, # Perkiraan
            estimated_cost=Decimal("0.02") # Perkiraan
        )
        db.add(log)
        db.commit()

        # 4. Otomatisasi pengiriman hasil email langsung (Opsional di MVP - dikirim setelah review,
        # tapi di PRD tertulis 'email hasil otomatis'. Kita kirim langsung sebagai default.)
        exam = db.query(Exam).filter(Exam.id == submission.exam_id).first()
        exam_title = exam.title if exam else "Ujian Essay"
        email_sent = send_evaluation_email(
            to_email=submission.student_email,
            student_name=submission.student_name,
            exam_title=exam_title,
            total_score=float(grading_result.final_score),
            overall_feedback=grading_result.overall_feedback,
            scores_breakdown=grading_result.scores_breakdown
        )
        print(f"Email sent status: {email_sent}")

    except Exception as e:
        print(f"Error memproses submission {submission_id}: {e}")
        submission.status = "FAILED"
        db.commit()

        # Catat log sistem gagal
        log = SystemLog(
            event_type="SUBMISSION_PROCESSING_FAILED",
            message=f"Gagal memproses lembar jawaban mahasiswa {submission.student_name} (NIM: {submission.student_nim}). Error: {str(e)}",
            token_used=0,
            estimated_cost=Decimal("0.00")
        )
        db.add(log)
        db.commit()
    finally:
        # Bersihkan file temporer
        if temp_pdf and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
