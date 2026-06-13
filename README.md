# AI Exam Assessment System

> Platform pemeriksaan jawaban ujian essay berbasis AI terintegrasi menggunakan Google Form, Multimodal Vision LLM, FastAPI, Next.js, dan Redis/Celery.

[![Deployment Status](https://img.shields.io/badge/domain-exam.adi--muhamad.my.id-blue?style=for-the-badge)](https://exam.adi-muhamad.my.id)
[![Tech Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20Next.js%20%7C%20Postgres%20%7C%20Redis-success?style=for-the-badge)](#tech-stack)

---

## 📖 Ringkasan Proyek

**AI Exam Assessment System** adalah solusi cerdas untuk otomatisasi koreksi lembar jawaban essay mahasiswa yang diunggah dalam format PDF. Dengan menggabungkan teknologi **Multimodal Vision AI (GPT-4o-mini / Gemini 1.5 Flash)** untuk mengekstrak tulisan tangan secara akurat dan menilai konten secara objektif, sistem ini memangkas beban administratif koreksi dosen secara signifikan.

Sistem dirancang dengan arsitektur asinkron yang tangguh (*queue-based*) agar dapat berjalan stabil dan hemat resource pada server berspesifikasi minimum (VPS RAM 4GB).

---

## 🛠️ Tech Stack

### 💻 Frontend (Dashboard Monitoring)
* **Next.js 14** (App Router)
* **Tailwind CSS** & **Shadcn UI** (Desain modern dan dinamis)
* **TanStack Table** (Manajemen data tabel yang interaktif)
* **Recharts** (Analitik visual performa kelas)

### ⚙️ Backend (Core Engine & Workers)
* **FastAPI** (Python framework berkinerja tinggi)
* **Celery & Redis** (FIFO Queue & distributed processing)
* **PyMuPDF (fitz)** (PDF processing & image conversion)
* **PostgreSQL** (Penyimpanan relasional tangguh)
* **SQLAlchemy** (Python ORM)

### 🤖 AI & Integrasi Eksternal
* **Google Apps Script Webhook** (Integrasi instan dari Google Form)
* **GPT-4o-mini / Gemini 1.5 Flash** (Vision & Text Scoring API)
* **Resend API** (Otomatisasi pengiriman laporan hasil ke email mahasiswa)

---

## 📂 Struktur Repositori (Monorepo)

```txt
exam-ai/
├── backend/            # FastAPI Backend & Celery Workers
│   ├── app/
│   │   ├── api/        # Endpoint API & Webhooks
│   │   ├── core/       # Konfigurasi, Keamanan, & Database
│   │   ├── models/     # Model Database (SQLAlchemy)
│   │   ├── services/   # Logika bisnis (Vision LLM, Resend Email)
│   │   └── workers/    # Task Celery (Async Jobs)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/           # Next.js Dashboard UI
│   ├── src/
│   │   ├── app/        # Halaman Next.js (Dashboard, Rubrik, Queue, dll.)
│   │   ├── components/ # Komponen UI Reusable
│   │   └── lib/        # API Client & utilitas
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml  # Orkestrasi Docker lokal/produksi
├── PRD.md              # Dokumen Kebutuhan Produk (Final)
└── README.md           # Panduan Dokumentasi (File Ini)
```

---

## 🔄 Alur Kerja Sistem (Workflow)

```txt
1. Mahasiswa mengunggah PDF jawaban ujian ke Google Form.
2. Google Apps Script menangkap event 'onFormSubmit' dan mengirim data via Webhook (HTTP POST) ke FastAPI.
3. Backend FastAPI memvalidasi data dan memasukkannya ke antrean Redis (status: QUEUED).
4. Celery Worker mengambil tugas (FIFO):
   a. Mengunduh dan mengonversi PDF menjadi gambar beresolusi tinggi (PNG/JPEG) halaman demi halaman.
   b. Mengirimkan gambar tersebut ke Vision LLM untuk transkripsi tulisan tangan.
   c. Mengevaluasi hasil transkripsi berdasarkan rubrik & kunci jawaban (Scoring).
5. Hasil penilaian disimpan ke dalam PostgreSQL.
6. Email berisi detail penilaian dan feedback dikirim secara otomatis ke mahasiswa melalui Resend API.
```

---

## 🚀 Panduan Memulai Cepat (Local Setup)

### Prasyarat
* Docker & Docker Compose terinstal di komputer Anda.
* Kredensial API untuk OpenAI (GPT-4o-mini) atau Google Gemini.
* API Key Resend untuk pengiriman email.

### Langkah 1: Kloning Repositori
```bash
git clone https://github.com/adimhsd/exam-ai.git
cd exam-ai
```

### Langkah 2: Konfigurasi Environment Variables
Buat berkas `.env` di folder root / backend sesuai template berikut:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=securepassword
POSTGRES_DB=exam_db
DATABASE_URL=postgresql://postgres:securepassword@db:5432/exam_db

# Redis
REDIS_URL=redis://redis:6379/0

# LLM APIs
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Resend Email Service
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Exam System <no-reply@exam.adi-muhamad.my.id>
```

### Langkah 3: Jalankan dengan Docker Compose
Jalankan perintah berikut untuk membangun dan menjalankan semua container secara bersamaan:

```bash
docker-compose up --build -d
```

Setelah berjalan:
* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API (Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Redis Instance:** `localhost:6379`

---

## 📝 Konfigurasi Webhook Google Apps Script

Untuk mengaktifkan pengiriman data otomatis dari Google Form ke backend FastAPI Anda, ikuti langkah berikut:

1. Buka Google Sheet tempat tanggapan Form disimpan.
2. Pilih menu **Extensions** > **Apps Script**.
3. Hapus kode bawaan dan tempel kode berikut:

```javascript
function onSubmit(e) {
  var url = "https://exam.adi-muhamad.my.id/api/v1/webhook/submit";
  
  var response = e.values;
  var payload = {
    "timestamp": response[0],
    "email": response[1],
    "nama": response[2],
    "nim": response[3],
    "file_url": response[4] // Sesuaikan indeks kolom di Google Sheet Anda
  };
  
  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };
  
  UrlFetchApp.fetch(url, options);
}
```
4. Buat trigger baru di bagian **Triggers (ikon jam)** > **Add Trigger** > Pilih fungsi `onSubmit` > Event Source: `From spreadsheet` > Event type: `On form submit` > Simpan dan Berikan Izin Akses.

---

## 🗺️ Roadmap Pengembangan

* **Phase 1 (MVP) — Sedang Berjalan:**
  - Setup dasar monorepo.
  - Endpoint Webhook FastAPI & integrasi Redis/Celery.
  - Pipeline pemrosesan Vision LLM (transkripsi tulisan tangan).
  - Skema database PostgreSQL.
  - Template email laporan hasil ujian via Resend.
* **Phase 2 — Fitur Dosen & Analitik:**
  - Pembuatan UI Dashboard Next.js untuk monitoring antrean.
  - Halaman edit transkripsi OCR secara manual & persetujuan dosen sebelum email dikirim.
  - Halaman pembuatan rubrik penilaian interaktif.
  - Visualisasi analitik nilai kelas (distribusi nilai, rata-rata, soal paling sulit).
* **Phase 3 — Integrasi Eksternal & Keamanan:**
  - Integrasi SSO Kampus / JWT Auth.
  - Deteksi plagiarisme sederhana.
  - Integrasi nilai balik langsung ke LMS (Moodle / Canvas).
