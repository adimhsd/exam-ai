import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.endpoints import router

from alembic.config import Config
from alembic import command

# Menjalankan migrasi database otomatis menggunakan Alembic saat startup
max_retries = 5
for i in range(max_retries):
    try:
        # Pastikan koneksi database siap
        with engine.connect() as conn:
            pass
        print("Koneksi database berhasil. Menerapkan migrasi Alembic...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        print("Migrasi database berhasil diterapkan.")
        break
    except Exception as e:
        print(f"Percobaan inisialisasi basis data / migrasi gagal ({i+1}/{max_retries}): {e}")
        time.sleep(3)

app = FastAPI(
    title="AI Exam Assessment System API",
    description="Backend API untuk memproses OCR, penilaian ujian esai berbasis AI, dan monitoring queue.",
    version="1.0.0"
)

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin di lingkungan dev/tunnels
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "AI Exam Assessment API is running."}
