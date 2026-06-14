"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Silakan masukkan email dan password.");
      return;
    }

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-tertiary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-border-subtle shadow-xl overflow-hidden relative z-10 flex flex-col transition-all hover:shadow-2xl">
        {/* Header Header */}
        <div className="bg-primary px-8 py-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-full mb-4 backdrop-blur-md">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <h2 className="font-display text-headline-md font-bold tracking-tight mb-1">Masuk ke exam-ai</h2>
          <p className="text-white/80 text-body-sm font-sans">Sistem Penilaian Ujian Akademik AI</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Alamat Email Dosen
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg">
                mail
              </span>
              <input
                required
                type="email"
                placeholder="Contoh: dosen@univ.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Kata Sandi / Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 text-lg">
                lock
              </span>
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-primary transition-colors"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                <span className="material-symbols-outlined text-lg">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Sedang Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk Akun</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-4 border-t border-border-subtle flex justify-between items-center text-xs text-on-surface-variant">
            <span>Perlu mengunggah jawaban?</span>
            <Link href="/submit" className="text-primary hover:underline font-bold flex items-center gap-1">
              Portal Mahasiswa
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
