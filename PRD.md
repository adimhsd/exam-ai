# Product Requirement Document (PRD)
# AI Exam Assessment System
## Domain: exam.adi-muhamad.my.id

---

## 1. Ringkasan Produk

**AI Exam Assessment System** adalah platform pemeriksaan jawaban essay mahasiswa berbasis Kecerdasan Buatan (AI) yang dirancang untuk membantu dosen/korektor melakukan penilaian otomatis dan objektif terhadap lembar jawaban ujian dalam format PDF hasil scan.

Sistem ini memanfaatkan:
- **Google Form & Google Apps Script (Webhook)** sebagai gerbang pengumpulan jawaban mahasiswa.
- **Multimodal Vision LLM (GPT-4o-mini / Gemini 1.5 Flash)** untuk mengekstrak tulisan tangan (handwritten OCR) sekaligus menganalisis konten secara presisi.
- **FastAPI (Python)** sebagai API Backend yang andal dan cepat.
- **Next.js & TailwindCSS** untuk dashboard admin pengelolaan ujian, rubrik, monitoring antrean, dan analitik.
- **Redis & Celery** untuk manajemen antrean pemrosesan dokumen secara asinkron (*batch processing*).
- **Resend** untuk otomatisasi pengiriman hasil ujian langsung ke email mahasiswa.

Platform ini dirancang agar efisien terhadap penggunaan resource VPS (dapat berjalan stabil pada VPS dengan RAM 4GB), mendukung konkurensi, aman, serta siap digunakan untuk skala banyak mata kuliah sekaligus.

---

## 2. Tujuan & Nilai Bisnis

Proses koreksi ujian essay manual sering kali menghadapi tantangan berupa:
- **Waktu koreksi yang lama**, terutama untuk kelas besar.
- **Subjektivitas penilaian** yang berpotensi memicu ketidakkonsistenan antardosen atau antarwaktu pemeriksaan.
- **Administrasi manual** pengiriman nilai dan umpan balik (feedback) ke mahasiswa.

**Tujuan Utama Platform:**
1. **Efisiensi Waktu:** Memangkas waktu koreksi dari hitungan hari menjadi hitungan menit per kelas.
2. **Konsistensi Penilaian:** Menjamin standar penilaian yang sama untuk setiap lembar jawaban berdasarkan rubrik yang kaku dan jelas.
3. **Feedback Berkualitas:** Memberikan penjelasan detail kepada mahasiswa mengenai letak kekurangan dan kelebihan jawaban mereka.
4. **Optimasi Resource Server:** Menggunakan API Cloud Multimodal Vision daripada menjalankan model OCR lokal (seperti PaddleOCR) yang memakan RAM/CPU VPS secara ekstrem.

---

## 3. Ruang Lingkup Sistem

### 3.1 Fitur yang Ditangani (In-Scope)
- **Integrasi Webhook Google Form:** Menerima data pengumpulan jawaban secara instan (real-time).
- **Pemrosesan PDF Multimodal:** Merender halaman PDF menjadi gambar menggunakan PyMuPDF, lalu mengirimkannya ke Vision LLM untuk transkripsi dan penilaian.
- **Penilaian Berbasis Rubrik & Kunci Jawaban:** Evaluasi essay menggunakan parameter bobot, indikator penilaian, dan kata kunci penting.
- **Queue System (Redis & Celery):** Antrean FIFO untuk mencegah overload VPS saat pemrosesan batch.
- **Dashboard Admin (Next.js):** Antarmuka kelola mata kuliah, rubrik, monitoring status antrean, edit manual hasil OCR, dan review manual hasil AI.
- **Otomatisasi Email (Resend):** Mengirimkan PDF hasil evaluasi langsung ke email mahasiswa.
- **Logging & Analytics:** Log pemrosesan detail, biaya API LLM, serta grafik distribusi nilai kelas.

### 3.2 Fitur yang Belum Ditangani (Out-of-Scope / Tahap Lanjutan)
- Deteksi Plagiarisme antar-mahasiswa.
- Integrasi langsung dengan LMS (Moodle, Canvas, dll.) - *Rencana Phase 3*.
- Pengawasan ujian berbasis AI (AI Proctoring).
- Pemeriksaan jawaban berbasis gambar rumus matematika/kimia kompleks atau diagram visual.
- Aplikasi mobile native (iOS/Android).

---

## 4. Peran Pengguna (User Roles)

### 4.1 Admin / Dosen
- **Kelola Mata Kuliah & Ujian:** Membuat, mengedit, atau menghapus data mata kuliah, kelas, dan periode ujian.
- **Kelola Soal & Rubrik:** Menentukan bobot nilai, kunci jawaban, indikator, kata kunci, dan instruksi penilaian AI per soal.
- **Monitor Antrean (Queue):** Melihat progress antrean, memicu ulang pemrosesan yang gagal (*retry*), atau membatalkan antrean.
- **OCR & Assessment Review:** Memeriksa teks hasil ekstraksi Vision LLM, mengedit manual jika ada kesalahan transkripsi, serta mengubah skor AI jika diperlukan sebelum dikirim ke mahasiswa.
- **Kirim Hasil:** Memicu pengiriman email hasil ujian secara manual atau otomatis setelah review selesai.

### 4.2 Mahasiswa
- **Submit Jawaban:** Mengunggah lembar jawaban PDF hasil scan (misalnya melalui CamScanner) ke Google Form yang disediakan.
- **Menerima Laporan:** Menerima email berisi rincian nilai per soal, skor total, dan feedback perbaikan dalam bentuk lampiran/konten email terstruktur.
- *Catatan: Mahasiswa tidak memiliki hak akses masuk ke dashboard admin.*

---

## 5. Alur Kerja (Workflow) & Integrasi Webhook

```
Mahasiswa
   │
   ▼
[Submit Google Form]
   │
   ▼
[Google Sheet (Apps Script)] ──(HTTP POST Webhook)──► [FastAPI Backend]
                                                            │
                                                            ▼
                                                   [Simpan ke DB & Redis]
                                                            │
                                                            ▼
                                                     [Celery Worker]
                                                            │
                                             ┌──────────────┴──────────────┐
                                             ▼                             ▼
                                      [OCR / Vision]                 [AI Grading]
                                    PyMuPDF render PDF            Evaluasi dengan rubrik
                                    ke image, kirim ke             & kunci jawaban via
                                   GPT-4o-mini (Vision)               GPT-4o-mini
                                             │                             │
                                             └──────────────┬──────────────┘
                                                            ▼
                                                   [Simpan ke Postgres]
                                                            │
                                                            ▼
                                                   [Kirim Email Resend]
```

### Mekanisme Pengiriman Data:
1. Mahasiswa mengunggah PDF jawaban ujian dan mengisi Nama/NIM/Email di Google Form.
2. Respons tersimpan otomatis di Google Spreadsheet.
3. Skrip Google Apps Script dipicu oleh event `onFormSubmit` dan mengirim payload JSON ke endpoint `/api/v1/webhook/submit` di FastAPI:
   ```json
   {
     "nim": "12345678",
     "nama": "Adi Muhamad",
     "email": "mahasiswa@domain.com",
     "file_url": "https://drive.google.com/file/d/...",
     "exam_id": "exam-uuid-xyz"
   }
   ```
4. Backend FastAPI memvalidasi data, mengunduh file PDF dari Drive, memasukkan data ke antrean Redis, dan merespons `200 OK` ke Google Webhook.

---

## 6. Arsitektur Teknis

Sistem akan dideploy menggunakan arsitektur modular berbasis Docker Compose.

### 6.1 Frontend (Next.js Dashboard)
- **Tech Stack:** Next.js (App Router), TailwindCSS, Shadcn UI, TanStack Table.
- **Fungsi:** Dashboard visual yang modern dengan visualisasi data, tabel interaktif dengan fitur filter antrean, editor rubrik ujian yang intuitif, serta area *review* berdampingan antara gambar jawaban asli dan teks hasil transkripsi.

### 6.2 Backend (FastAPI Python)
- **Tech Stack:** FastAPI, SQLAlchemy (PostgreSQL ORM), Celery, Pydantic.
- **Fungsi:** Manajemen bisnis logis, RESTful API untuk frontend, penanganan payload webhook, dan pengelolaan database.

### 6.3 Queue & Worker (Redis & Celery)
- **Tech Stack:** Redis (sebagai Message Broker), Celery (sebagai Task Queue Runner).
- **Task Terdistribusi:**
  - `tasks.process_pdf_ocr`: Mengunduh PDF, merender halaman menjadi gambar, melakukan transkripsi visual (Vision LLM), dan menstrukturkan teks per nomor soal.
  - `tasks.evaluate_essay`: Mengambil hasil transkripsi, membandingkan dengan rubrik/kunci jawaban, memanggil API LLM untuk scoring, dan menulis hasil ke DB.
  - `tasks.send_result_email`: Membuat draf laporan HTML/PDF dan mengirimkannya melalui Resend API.

### 6.4 Database (PostgreSQL)
- Menyimpan skema relasional:
  - `Users` & `Roles` (Dosen/Admin)
  - `Courses` (Mata Kuliah)
  - `Exams` (Detail Ujian & Metadata Google Form)
  - `Rubrics` (Kunci jawaban, kriteria nilai per nomor soal)
  - `Submissions` (Data mahasiswa, status antrean, URL berkas)
  - `GradingResults` (Skor per soal, feedback, confidence score AI, status review manual)
  - `SystemLogs` (Log audit untuk pemantauan token dan estimasi biaya)

### 6.5 OCR & AI Scoring Pipeline
- **Rekomendasi Terpilih:** **Multimodal Vision Pipeline**.
  1. **Render PDF:** PyMuPDF (`fitz`) mengonversi PDF halaman mahasiswa menjadi gambar PNG beresolusi tinggi (min. 150 DPI).
  2. **Vision OCR:** Gambar dikirim ke API **GPT-4o-mini** dengan instruksi: *"Ekstrak jawaban tertulis pada kertas ujian ini. Kelompokkan berdasarkan nomor soal secara berurutan. Perbaiki kesalahan ejaan kecil tetapi jangan ubah esensi kalimat jawaban."*
  3. **Grading & Feedback:** Teks terstruktur hasil ekstraksi dikirim kembali ke LLM bersamaan dengan Rubrik & Kunci Jawaban. Output LLM wajib diformat dalam JSON valid:
     ```json
     {
       "scores": [
         {
           "question_number": 1,
           "score": 25,
           "max_score": 30,
           "criteria_met": ["Menyebutkan 3 komponen utama", "Definisi tepat"],
           "feedback": "Jawaban sangat baik, tetapi penjelasan komponen ketiga kurang mendalam."
         }
       ],
       "total_score": 85,
       "overall_feedback": "Secara keseluruhan pemahaman konsep sangat kuat. Perlu meningkatkan kedalaman argumen di beberapa bagian.",
       "confidence_score": 0.92
     }
     ```

---

## 7. Desain Database (Skema Relasional Utama)

### `Courses`
- `id` (UUID, PK)
- `code` (VARCHAR)
- `name` (VARCHAR)
- `lecturer_id` (UUID, FK)

### `Exams`
- `id` (UUID, PK)
- `course_id` (UUID, FK)
- `title` (VARCHAR)
- `date` (DATE)
- `is_active` (BOOLEAN)

### `Rubrics`
- `id` (UUID, PK)
- `exam_id` (UUID, FK)
- `question_number` (INT)
- `question_text` (TEXT)
- `answer_key` (TEXT)
- `max_score` (INT)
- `rubric_criteria` (JSONB) -- Kriteria poin penilaian

### `Submissions`
- `id` (UUID, PK)
- `exam_id` (UUID, FK)
- `student_nim` (VARCHAR)
- `student_name` (VARCHAR)
- `student_email` (VARCHAR)
- `file_url` (VARCHAR) -- Path lokal atau URL Cloud Storage
- `status` (VARCHAR) -- `QUEUED`, `PROCESSING_OCR`, `PROCESSING_GRADING`, `COMPLETED`, `FAILED`
- `created_at` (TIMESTAMP)

### `GradingResults`
- `id` (UUID, PK)
- `submission_id` (UUID, FK)
- `raw_ocr_text` (TEXT) -- Hasil ekstraksi teks
- `scores_breakdown` (JSONB) -- Detail nilai per nomor soal
- `total_score` (NUMERIC)
- `overall_feedback` (TEXT)
- `confidence_score` (NUMERIC)
- `is_reviewed` (BOOLEAN)
- `reviewed_by` (UUID, FK)
- `final_score` (NUMERIC)

---

## 8. Rencana Deployment & Kebutuhan VPS

### 8.1 Spesifikasi Server
- **Minimum:** 2 vCPU, RAM 4GB, SSD 80GB (Sesuai rekomendasi optimalisasi Vision API).
- **Rekomendasi:** RAM 8GB jika volume konkurensi pemeriksaan bersamaan tinggi (> 50 mahasiswa secara simultan).

### 8.2 Struktur Docker Compose (`docker-compose.yml`)
- `db`: PostgreSQL image resmi.
- `redis`: Redis image resmi.
- `backend`: Container FastAPI Python.
- `celery_worker`: Container worker Python (menggunakan codebase yang sama dengan backend).
- `frontend`: Container Next.js (Production build).
- `nginx`: Server proksi terbalik (Reverse Proxy) untuk routing traffic frontend/backend serta sertifikat SSL (atau diintegrasikan dengan Cloudflare Tunnel).

---

## 9. Manajemen Risiko Teknis & Mitigasi

| Risiko Teknis | Dampak | Mitigasi |
|---|---|---|
| Kualitas scan PDF buruk/blur | Ekstraksi teks oleh Vision LLM tidak akurat | Filter format wajib di Google Form; Gunakan instruksi sistem pada Form agar mahasiswa memotret lembar kertas secara tegak lurus dan pencahayaan terang. |
| Out of Memory (OOM) pada VPS RAM 4GB | Server crash, proses terhenti | Menolak model OCR lokal (PaddleOCR/Tesseract). Pemrosesan OCR dialihkan ke API Cloud (Multimodal LLM) yang hanya membutuhkan bandwidth internet ringan. Batasi Celery concurrency ke `concurrency=2` pada VPS RAM 4GB. |
| Token API LLM boros & estimasi biaya membengkak | Biaya operasional tinggi | Simpan hasil ekstraksi teks (transkripsi) di database, sehingga jika dilakukan penilaian ulang (*re-grade*) dengan rubrik baru, sistem tidak perlu memanggil Vision API yang mahal lagi (cukup memanggil LLM teks standar menggunakan teks transkripsi yang sudah tersimpan). |
| Ketidakkonsistenan penilaian AI (*Hallucination*) | Ketidakpuasan mahasiswa | Terapkan `temperature = 0.0` pada API model grading untuk menjamin konsistensi deterministik. Dosen wajib memiliki halaman *Review Manual* di dashboard untuk menyetujui atau mengoreksi nilai AI sebelum dikirim ke email. |

---

## 10. Indikator Keberhasilan MVP (Phase 1)
- Waktu respons webhook Google Form di bawah 2 detik.
- Kecepatan pemrosesan satu berkas PDF jawaban (transkripsi + penilaian + email hasil) di bawah 90 detik.
- Akurasi ekstraksi teks tulisan tangan oleh Vision LLM di atas 90% (berdasarkan sampel keterbacaan manusia).
- Sistem stabil berjalan di VPS 4GB RAM tanpa terjadi memori OOM atau *container restart*.
