import resend
from app.core.config import settings

def send_evaluation_email(
    to_email: str,
    student_name: str,
    exam_title: str,
    total_score: float,
    overall_feedback: str,
    scores_breakdown: list
) -> bool:
    if not settings.RESEND_API_KEY:
        print("Resend API key not configured. Skipping email sending.")
        return False
    
    resend.api_key = settings.RESEND_API_KEY
    
    # Render HTML content
    html_content = f"""
    <div style="font-family: 'Inter', sans-serif; color: #1a1b23; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color: #0037b0; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Hasil Penilaian Ujian</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">{exam_title}</p>
        </div>
        <div style="padding: 32px; background-color: #ffffff;">
            <p>Halo <strong>{student_name}</strong>,</p>
            <p>Berikut adalah rincian hasil penilaian lembar jawaban ujian Anda yang telah diperiksa menggunakan sistem penilaian AI kami berdasarkan rubrik yang telah ditetapkan:</p>
            
            <div style="background-color: #faf8ff; border: 1px solid #2151da; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #434655; font-weight: 600;">Total Nilai</span>
                <div style="font-size: 48px; font-weight: 800; color: #0037b0; margin-top: 4px;">{total_score:.1f}</div>
            </div>
            
            <h3 style="border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-top: 32px; font-size: 16px;">Umpan Balik Dosen (AI Evaluator):</h3>
            <p style="font-style: italic; background-color: #F8FAFC; padding: 12px; border-left: 4px solid #747686; color: #434655; font-size: 14px;">"{overall_feedback}"</p>
            
            <h3 style="border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-top: 32px; font-size: 16px;">Rincian Nilai Per Soal:</h3>
            <div style="margin-top: 16px;">
    """
    
    for item in scores_breakdown:
        q_num = item.get("question_number")
        score = item.get("score")
        max_score = item.get("max_score")
        criteria = item.get("criteria_met", [])
        feedback = item.get("feedback", "")
        
        criteria_list = "".join([f'<span style="display: inline-block; background-color: #e2e1ed; color: #1a1b23; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px;">✓ {c}</span>' for c in criteria])
        
        html_content += f"""
                <div style="border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #0037b0; font-size: 14px;">Pertanyaan #{q_num}</span>
                        <span style="font-weight: 700; font-size: 14px;">Nilai: {score} / {max_score}</span>
                    </div>
                    <p style="font-size: 13px; color: #434655; margin: 8px 0;"><strong>Feedback:</strong> {feedback}</p>
                    <div style="margin-top: 8px;">
                        {criteria_list}
                    </div>
                </div>
        """
        
    html_content += """
            </div>
            
            <p style="margin-top: 32px; font-size: 12px; color: #747686; text-align: center;">
                Email ini dikirim secara otomatis oleh AI Exam Assessment System.<br/>
                Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi dosen pengampu mata kuliah terkait.
            </p>
        </div>
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px; text-align: center; font-size: 12px; color: #747686;">
            © 2026 exam-ai Academic Institutional. All rights reserved.
        </div>
    </div>
    """
    
    try:
        params = {
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": f"Hasil Penilaian Ujian: {exam_title} - {student_name}",
            "html": html_content
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email via Resend: {e}")
        return False
