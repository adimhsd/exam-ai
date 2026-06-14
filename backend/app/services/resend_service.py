import resend
from app.core.config import settings

def send_evaluation_email(
    to_email: str,
    student_name: str,
    exam_title: str,
    total_score: float,
    overall_feedback: str,
    scores_breakdown: list,
    student_nim: str = None
) -> bool:
    if not settings.RESEND_API_KEY:
        print("Resend API key not configured. Skipping email sending.")
        return False
    
    resend.api_key = settings.RESEND_API_KEY
    
    # Calculate total max score and overall score percentage
    total_max = sum(float(item.get("max_score") or 0) for item in scores_breakdown)
    percentage = (total_score / total_max * 100) if total_max > 0 else 0
    is_passed = percentage >= 60.0
    
    # Pass/fail visual parameters
    if is_passed:
        status_bg = "#ecfdf5"
        status_border = "#a7f3d0"
        status_badge = '<div style="font-size: 15px; font-weight: 800; color: #059669; margin-top: 4px;">✓ LULUS</div>'
    else:
        status_bg = "#fef2f2"
        status_border = "#fca5a5"
        status_badge = '<div style="font-size: 15px; font-weight: 800; color: #dc2626; margin-top: 4px;">⚠ BELUM LULUS</div>'
        
    # Render HTML content
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Hasil Penilaian Ujian</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <div style="font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; max-width: 600px; margin: 40px auto; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 55, 176, 0.04); background-color: #ffffff;">
        
        <!-- Header Section -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0037b0 0%, #1c52d4 100%); padding: 36px 32px; text-align: center;">
            <tr>
                <td>
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.18); color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; font-family: sans-serif;">
                        AI Evaluator • Laporan Resmi
                    </div>
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">Hasil Penilaian Ujian</h1>
                    <p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.85); font-size: 14px; font-weight: 500;">{exam_title}</p>
                </td>
            </tr>
        </table>
        
        <!-- Main Content Area -->
        <div style="padding: 32px;">
            <p style="margin-top: 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Halo <strong>{student_name}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Berikut adalah rincian hasil penilaian lembar jawaban ujian Anda yang telah diperiksa menggunakan sistem penilaian otomatis berbasis Vision AI kami berdasarkan rubrik akademik yang telah ditetapkan.
            </p>
            
            <!-- Student Profile Details -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
                <tr>
                    <td style="padding: 16px; background-color: #F8FAFC;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em; padding-bottom: 4px;">Nama Mahasiswa</td>
                                <td style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em; padding-bottom: 4px; text-align: right;">{"NIM" if student_nim else "Email"}</td>
                            </tr>
                            <tr>
                                <td style="font-size: 14px; font-weight: 700; color: #0F172A;">{student_name}</td>
                                <td style="font-size: 14px; font-weight: 700; color: #0F172A; text-align: right;">{student_nim if student_nim else to_email}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            
            <!-- Scoring and Passing Badges -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                    <td width="48%" valign="top" style="padding: 18px; background-color: #faf8ff; border: 1.5px solid #2151da; border-radius: 12px; text-align: center; box-sizing: border-box;">
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 700; display: block; margin-bottom: 4px;">Total Skor</span>
                        <span style="font-size: 38px; font-weight: 900; color: #0037b0; font-family: sans-serif;">{total_score:.1f}</span>
                        <span style="font-size: 16px; color: #475569; font-weight: 700;"> / {total_max:.1f}</span>
                    </td>
                    <td width="4%"></td>
                    <td width="48%" valign="top" style="padding: 18px; background-color: {status_bg}; border: 1.5px solid {status_border}; border-radius: 12px; text-align: center; box-sizing: border-box;">
                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; font-weight: 700; display: block; margin-bottom: 6px;">Status Kelulusan</span>
                        {status_badge}
                        <span style="font-size: 11px; color: #64748B; display: block; margin-top: 8px;">Batas Kelulusan: >= 60%</span>
                    </td>
                </tr>
            </table>
            
            <!-- Overall Evaluation Callout -->
            <div style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Catatan Evaluator Dosen:</h3>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 16px; background-color: #F8FAFC; border-left: 4px solid #0037b0; border-radius: 0 12px 12px 0; font-size: 13.5px; line-height: 1.6; color: #334155; font-style: italic;">
                            "{overall_feedback}"
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Breakdown Section Title -->
            <h3 style="border-bottom: 2px solid #F1F5F9; padding-bottom: 10px; margin: 32px 0 18px 0; font-size: 15px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.03em;">Rincian Nilai Per Nomor Soal</h3>
            
            <!-- Questions Loop -->
            <div style="margin-top: 16px;">
    """
    
    for item in scores_breakdown:
        q_num = item.get("question_number")
        score = float(item.get("score") or 0)
        max_score = float(item.get("max_score") or 0)
        criteria = item.get("criteria_met", [])
        feedback = item.get("feedback", "")
        
        # Calculate single question percentage
        q_pct = (score / max_score * 100) if max_score > 0 else 0
        
        # Color coding progress bars
        if q_pct >= 80.0:
            bar_color = "#10B981"  # Emerald green (excellent)
        elif q_pct >= 50.0:
            bar_color = "#0037b0"  # Cobalt blue (good/passed)
        else:
            bar_color = "#EF4444"  # Coral red (improvement needed)
            
        criteria_list = "".join([
            f'<span style="display: inline-block; background-color: #F1F5F9; color: #334155; border: 1px solid #E2E8F0; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; margin-right: 6px; margin-bottom: 6px; font-family: sans-serif;">✓ {c}</span>' 
            for c in criteria
        ])
        
        criteria_html = f"""
        <div style="margin-top: 14px;">
            <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 6px;">Kriteria yang Terpenuhi:</div>
            <div style="font-size: 0; line-height: 0;">
                {criteria_list}
            </div>
        </div>
        """ if criteria else ""
        
        html_content += f"""
                <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 16px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0, 55, 176, 0.01);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                        <tr>
                            <td style="font-size: 14px; font-weight: 800; color: #0037b0; text-transform: uppercase; letter-spacing: 0.02em;">Soal #{q_num}</td>
                            <td style="text-align: right; font-size: 13px; font-weight: 700; color: #475569;">
                                Nilai: <span style="font-size: 16px; font-weight: 800; color: #0037b0;">{score:.1f}</span> / {max_score:.1f}
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Progress Bar -->
                    <div style="margin: 12px 0 16px 0; background-color: #F1F5F9; height: 8px; border-radius: 9999px; overflow: hidden; width: 100%;">
                        <div style="background-color: {bar_color}; height: 8px; border-radius: 9999px; width: {q_pct}%;"></div>
                    </div>
                    
                    <!-- Feedback text -->
                    <p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: #475569;">
                        <strong style="color: #0F172A;">Evaluasi Jawaban:</strong> {feedback}
                    </p>
                    
                    {criteria_html}
                </div>
        """
        
    html_content += """
            </div>
            
            <p style="margin-top: 36px; font-size: 12px; line-height: 1.6; color: #64748B; text-align: center; border-top: 1px solid #F1F5F9; padding-top: 20px;">
                Email ini dikirim secara otomatis oleh <strong>Sistem Penilaian Akademik AI ExamAI</strong>.<br/>
                Umpan balik dan penilaian di atas didasarkan pada lembar jawaban tulisan tangan yang dievaluasi menggunakan vision model sesuai dengan kunci jawaban dari dosen pengampu.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px; text-align: center; font-size: 11px; color: #64748B; font-weight: 500;">
            © 2026 Platform ExamAI • Penilaian Akademik Otomatis. All rights reserved.
        </div>
    </div>
</body>
</html>
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
