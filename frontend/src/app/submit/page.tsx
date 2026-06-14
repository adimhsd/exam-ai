"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Exam {
  id: string;
  title: string;
  is_active: boolean;
}

export default function StudentSubmissionPortal() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fileUrl, setFileUrl] = useState("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"); // Default dummy pdf
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"gform" | "simulasi">("gform");

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/exams`);
        if (res.ok) {
          const data = await res.json();
          setExams(data);
          // Auto select first active exam
          const active = data.find((e: Exam) => e.is_active);
          if (active) setSelectedExamId(active.id);
          else if (data.length > 0) setSelectedExamId(data[0].id);
        }
      } catch (err) {
        console.error("Gagal memuat ujian:", err);
      }
    }
    loadExams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || !nim || !name || !email || !fileUrl) {
      alert("Semua kolom formulir wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        email: email,
        nama: name,
        nim: nim,
        file_url: fileUrl,
        exam_id: selectedExamId,
      };

      const res = await fetch(`${API_BASE_URL}/api/v1/webhook/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage("Lembar jawaban ujian berhasil diunggah! AI sedang memproses penilaian di antrean.");
        // Reset form
        setNim("");
        setName("");
        setEmail("");
      } else {
        const err = await res.json();
        alert(`Gagal mengirimkan jawaban: ${err.detail || "Error server"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="glass-header sticky top-0 z-50 border-b border-border-subtle px-margin-mobile md:px-margin-desktop h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            <Link href="/" className="font-display text-headline-md font-bold text-primary tracking-tight">
              exam-ai
            </Link>
          </div>
          <div className="hidden md:block w-px h-6 bg-border-subtle mx-2"></div>
          <span className="hidden md:inline-block font-sans text-xs font-bold text-on-surface-variant tracking-widest uppercase">
            Portal Mahasiswa
          </span>
        </div>
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-lg text-xs font-bold"
          >
            Ke Dasbor Admin
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 px-margin-mobile md:px-margin-desktop">
        {/* Welcome & Instructions */}
        <div className="max-w-4xl w-full text-center mb-6">
          <h2 className="font-display text-headline-lg text-on-background mb-4">Pusat Pengiriman Ujian</h2>
          <p className="text-on-surface-variant text-body-md max-w-2xl mx-auto mb-6">
            Silakan pilih metode pengiriman lembar jawaban ujian di bawah ini. Pengiriman resmi menggunakan Google Form, sementara simulasi dapat dilakukan langsung untuk pengujian antrean AI lokal.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-border-subtle mb-8 max-w-md w-full justify-between gap-2 shadow-sm">
          <button
            onClick={() => setActiveTab("gform")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "gform"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
            Google Form (Resmi)
          </button>
          <button
            onClick={() => setActiveTab("simulasi")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "simulasi"
                ? "bg-primary text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">terminal</span>
            Simulasi Lokal
          </button>
        </div>

        {/* Form Container */}
        {activeTab === "gform" ? (
          <section className="max-w-2xl w-full bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-lg flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="bg-primary px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white">cloud_upload</span>
                <span className="text-white font-display text-body-md font-semibold">Pengunggahan Lembar Jawaban Fisik</span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <h3 className="font-display text-headline-sm font-bold text-on-surface">Unggah Berkas via Google Forms</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  Untuk memproses pengunggahan berkas fisik (scan lembar jawaban PDF), kami menggunakan formulir Google Forms resmi agar mendukung pengunggahan dokumen Anda dengan aman. Silakan klik tombol di bawah ini untuk mengakses Google Forms.
                </p>
              </div>

              <div className="bg-surface-container-lowest border border-border-subtle p-5 rounded-xl space-y-3">
                <h4 className="font-bold text-body-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">checklist</span>
                  Sebelum Mengisi Google Form, Pastikan:
                </h4>
                <ul className="space-y-2 text-xs text-on-surface-variant list-disc pl-5">
                  <li>Berkas scan lembar jawaban Anda dalam format <strong>PDF</strong> (maks. 10MB).</li>
                  <li>Tulisan tangan pada lembar jawaban dapat dibaca jelas dengan pencahayaan merata.</li>
                  <li>Anda memiliki <strong>NIM</strong> (Nomor Induk Mahasiswa) dan alamat email aktif yang terdaftar.</li>
                </ul>
              </div>

              <a
                href="https://forms.gle/yPtra3pVfisQNKaBA"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md text-center"
              >
                Buka Formulir Pengiriman Google Form
                <span className="material-symbols-outlined text-lg">open_in_new</span>
              </a>
            </div>
          </section>
        ) : (
          <section className="max-w-2xl w-full bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-lg flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="bg-primary px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-white">description</span>
                <span className="text-white font-display text-body-md font-semibold">Formulir Simulasi Pengiriman Lembar Jawaban</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {successMessage && (
                <div className="bg-status-completed/10 border border-status-completed/30 p-4 rounded-xl text-status-completed text-body-sm font-semibold text-center animate-bounce">
                  {successMessage}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Pilih Mata Kuliah & Ujian</label>
                {exams.length === 0 ? (
                  <div className="text-xs text-status-failed italic">
                    Belum ada ujian aktif terdaftar. Silakan lakukan "Seed Data Demo" di menu Mata Kuliah & Ujian admin terlebih dahulu.
                  </div>
                ) : (
                  <select
                    className="w-full bg-white border border-border-subtle rounded-lg p-3 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                  >
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.is_active ? "Aktif" : "Nonaktif"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Nomor Induk Mahasiswa (NIM)</label>
                  <input
                    required
                    placeholder="Contoh: 20210801042"
                    className="w-full bg-white border border-border-subtle rounded-lg p-3 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Nama Lengkap Mahasiswa</label>
                  <input
                    required
                    placeholder="Contoh: Rizky Ramadhan"
                    className="w-full bg-white border border-border-subtle rounded-lg p-3 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Alamat Email Mahasiswa</label>
                <input
                  required
                  placeholder="Contoh: mahasiswa@univ.ac.id"
                  className="w-full bg-white border border-border-subtle rounded-lg p-3 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="text-[10px] text-outline block mt-1">Laporan penilaian PDF & umpan balik dosen akan otomatis dikirimkan ke alamat email ini.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">URL Berkas PDF Jawaban (CamScanner Link)</label>
                <input
                  required
                  placeholder="https://..."
                  className="w-full bg-white border border-border-subtle rounded-lg p-3 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono text-xs"
                  type="text"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <span className="text-[10px] text-outline block mt-1">Masukkan URL langsung ke berkas PDF yang dapat diunduh (untuk demonstrasi, default menggunakan file dummy.pdf).</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || exams.length === 0}
                className="w-full py-4 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow disabled:opacity-50"
              >
                {isSubmitting ? "Mengirimkan Jawaban..." : "Submit Lembar Jawaban Simulasi"}
                <span className="material-symbols-outlined text-lg">cloud_upload</span>
              </button>
            </form>
          </section>
        )}

        {/* Final Checklist / Tips */}
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-5 bg-white border border-border-subtle rounded-xl flex items-center gap-4 shadow-sm">
            <span className="material-symbols-outlined text-ai-confidence-high text-3xl">check_circle</span>
            <div>
              <h4 className="font-bold text-body-sm">Format PDF Resmi</h4>
              <p className="text-xs text-on-surface-variant">Ukuran maksimum file 20MB</p>
            </div>
          </div>
          <div className="p-5 bg-white border border-border-subtle rounded-xl flex items-center gap-4 shadow-sm">
            <span className="material-symbols-outlined text-ai-confidence-high text-3xl">light_mode</span>
            <div>
              <h4 className="font-bold text-body-sm">Pencahayaan Jelas</h4>
              <p className="text-xs text-on-surface-variant">Hindari bayangan gelap pada scan</p>
            </div>
          </div>
          <div className="p-5 bg-white border border-border-subtle rounded-xl flex items-center gap-4 shadow-sm">
            <span className="material-symbols-outlined text-ai-confidence-high text-3xl">speed</span>
            <div>
              <h4 className="font-bold text-body-sm">Koreksi Cepat</h4>
              <p className="text-xs text-on-surface-variant">AI memproses penaksiran dalam waktu cepat</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface px-margin-mobile md:px-margin-desktop py-8 text-center text-xs text-outline">
        <p>© 2026 exam-ai Academic Institutional. All rights reserved.</p>
      </footer>
    </div>
  );
}
