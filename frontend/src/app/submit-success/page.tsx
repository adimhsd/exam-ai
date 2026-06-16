"use client";

import Link from "next/link";

export default function SubmitSuccessPage() {
  return (
    <div className="font-sans min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-status-completed/10 rounded-full blur-[120px] pointer-events-none"></div>

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
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center py-12 px-margin-mobile md:px-margin-desktop z-10">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-border-subtle p-8 md:p-10 shadow-xl text-center space-y-6 transition-all hover:shadow-2xl">
          {/* Animated Green Checkmark Badge */}
          <div className="w-20 h-20 bg-status-completed/10 rounded-full flex items-center justify-center mx-auto text-status-completed animate-bounce">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-headline-md font-bold text-on-surface">Lembar Jawaban Diterima!</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Berkas ujian Anda berhasil terkirim ke server **exam-ai**.
            </p>
          </div>

          {/* Alert Processing Box */}
          <div className="bg-surface-container-low border border-border-subtle p-6 rounded-xl text-left space-y-4 shadow-sm">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <div>
                <h4 className="font-bold text-body-sm text-primary">Status Antrean AI</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Berkas Anda sedang berada di antrean **OCR & Vision AI** untuk transkripsi dan penilaian otomatis.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start border-t border-border-subtle/60 pt-4">
              <span className="material-symbols-outlined text-status-processing mt-0.5 animate-spin">sync</span>
              <div>
                <h4 className="font-bold text-body-sm text-on-surface">Estimasi Waktu Tunggu</h4>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Proses analisis membutuhkan waktu sekitar **3 s.d 5 menit** sesuai antrean sistem. Laporan penilaian PDF dan umpan balik dosen akan dikirim langsung ke alamat email Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-outline italic">
            *Silakan periksa folder kotak masuk (Inbox) atau spam/promosi email Anda secara berkala.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/submit"
              className="flex-1 py-3.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Portal Pengiriman
            </Link>
            <Link
              href="/"
              className="flex-1 py-3.5 bg-surface-container-low border border-border-subtle text-primary font-bold rounded-lg hover:bg-surface-container-highest active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Dasbor Nilai
              <span className="material-symbols-outlined text-sm">dashboard</span>
            </Link>
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
