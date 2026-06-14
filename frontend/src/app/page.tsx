"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Stats {
  total_submissions: number;
  processing: number;
  completed: number;
  avg_score: number;
}

interface Submission {
  id: string;
  student_nim: string;
  student_name: string;
  student_email: string;
  status: string;
  created_at: string;
  exam_title: string;
  course_name: string;
}

interface RecentError {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

interface ChartItem {
  time: string;
  volume: number;
}

export default function Dashboard() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total_submissions: 0,
    processing: 0,
    completed: 0,
    avg_score: 0.0,
  });
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data on load and poll every 5 seconds for live queue monitoring
  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await authFetch(`${API_BASE_URL}/api/v1/overview/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);

        const subRes = await authFetch(`${API_BASE_URL}/api/v1/submissions`);
        const subData = await subRes.json();
        setSubmissions(subData);

        const errRes = await authFetch(`${API_BASE_URL}/api/v1/overview/recent-errors`);
        const errData = await errRes.json();
        setRecentErrors(errData);

        const chartRes = await authFetch(`${API_BASE_URL}/api/v1/overview/chart-data`);
        const chartVal = await chartRes.json();
        setChartData(chartVal);
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [authFetch]);

  // Format timestamp ISO to time string
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "00:00:00";
    }
  };

  // Rendering status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-completed/10 text-status-completed text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-completed"></span>
            COMPLETED
          </span>
        );
      case "PROCESSING_OCR":
      case "PROCESSING_GRADING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-processing/10 text-status-processing text-[11px] font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-status-processing"></span>
            {status === "PROCESSING_OCR" ? "PROCESSING OCR" : "PROCESSING GRADING"}
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-queued/10 text-status-queued text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-queued"></span>
            QUEUED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-failed/10 text-status-failed text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-failed"></span>
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            UNKNOWN
          </span>
        );
    }
  };

  // SVG Chart path calculation helper
  const renderChartPath = () => {
    if (chartData.length === 0) return "";
    const maxVal = Math.max(...chartData.map(d => d.volume), 5); // default max is 5 to prevent division by zero and scale nicely
    let d = "M0,180 ";
    const widthPerSegment = 800 / (chartData.length - 1);
    chartData.forEach((item, index) => {
      // Scale volume to y coordinates (y = 200 is bottom, y = 0 is top)
      const y = 180 - (item.volume / maxVal) * 150;
      const x = index * widthPerSegment;
      d += `L${x},${y} `;
    });
    return d;
  };

  const renderChartAreaPath = () => {
    const d = renderChartPath();
    if (!d) return "";
    return `${d} L800,200 L0,200 Z`;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Side Navigation */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="ml-sidebar-width flex-grow flex flex-col min-h-screen">
        {/* Top App Bar */}
        <Header title="Ringkasan" />

        {/* Main Content Area */}
        <main className="flex-1 p-margin-desktop max-w-container-max mx-auto w-full">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-margin-desktop">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant font-sans text-xs uppercase font-bold tracking-wider">Total Jawaban</span>
                <span className="material-symbols-outlined text-primary bg-primary-fixed/30 p-1.5 rounded-lg">upload_file</span>
              </div>
              <p className="font-display text-display-lg text-on-surface leading-tight">
                {stats.total_submissions.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-ai-confidence-high text-body-sm">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>Basis data berkas masuk</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant font-sans text-xs uppercase font-bold tracking-wider">Sedang Diproses</span>
                <span className="material-symbols-outlined text-status-processing bg-status-processing/10 p-1.5 rounded-lg">sync</span>
              </div>
              <p className="font-display text-display-lg text-on-surface leading-tight">
                {stats.processing}
              </p>
              <div className="flex items-center gap-1 text-on-surface-variant text-body-sm opacity-80">
                <span className="material-symbols-outlined text-sm">timer</span>
                <span>Worker Celery Aktif</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant font-sans text-xs uppercase font-bold tracking-wider">Selesai Dinilai</span>
                <span className="material-symbols-outlined text-status-completed bg-status-completed/10 p-1.5 rounded-lg">check_circle</span>
              </div>
              <p className="font-display text-display-lg text-on-surface leading-tight">
                {stats.completed}
              </p>
              <div className="flex items-center gap-1 text-ai-confidence-high text-body-sm">
                <span className="material-symbols-outlined text-sm">check</span>
                <span>
                  {stats.total_submissions > 0
                    ? ((stats.completed / stats.total_submissions) * 100).toFixed(1)
                    : 0}
                  % Tingkat Penyelesaian
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-on-surface-variant font-sans text-xs uppercase font-bold tracking-wider">Rata-rata Nilai</span>
                <span className="material-symbols-outlined text-tertiary bg-tertiary-fixed/30 p-1.5 rounded-lg">grade</span>
              </div>
              <p className="font-display text-display-lg text-on-surface leading-tight">
                {stats.avg_score}
              </p>
              <div className="flex items-center gap-1 text-on-surface-variant text-body-sm opacity-80">
                <span className="material-symbols-outlined text-sm">bar_chart</span>
                <span>Rata-rata Kelas Kumulatif</span>
              </div>
            </div>
          </section>

          {/* Grid for Charts and Errors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-margin-desktop">
            {/* Processing Volume Chart */}
            <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">Volume Pemrosesan</h3>
                  <p className="text-on-surface-variant text-body-sm">Volume berkas yang dianalisis dalam 24 jam terakhir</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-surface-variant text-on-surface-variant text-[10px] font-bold rounded">LIVE</span>
                </div>
              </div>
              <div className="h-64 flex items-end gap-2 px-2 relative">
                {chartData.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full px-2 pt-10" preserveAspectRatio="none" viewBox="0 0 800 200">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0037b0" stopOpacity="0.2"></stop>
                        <stop offset="100%" stopColor="#0037b0" stopOpacity="0"></stop>
                      </linearGradient>
                    </defs>
                    <path d={renderChartAreaPath()} fill="url(#chartGradient)"></path>
                    <path d={renderChartPath()} fill="none" stroke="#0037b0" strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                )}
                {/* Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-border-subtle pb-2">
                  <div className="w-full border-t border-border-subtle border-dashed opacity-30"></div>
                  <div className="w-full border-t border-border-subtle border-dashed opacity-30"></div>
                  <div className="w-full border-t border-border-subtle border-dashed opacity-30"></div>
                </div>
                {/* Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-on-surface-variant px-2 pb-1">
                  {chartData.map((item, index) => (
                    <span key={index}>{item.time}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Errors */}
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="font-display text-xl font-bold text-on-surface">Kesalahan Sistem Terbaru</h3>
                <p className="text-on-surface-variant text-body-sm">Kegagalan Antrean / Vision LLM</p>
              </div>
              <div className="space-y-4 overflow-y-auto max-h-64 flex-1 pr-1">
                {recentErrors.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant text-body-sm opacity-60">
                    Tidak ada log kesalahan sistem saat ini.
                  </div>
                ) : (
                  recentErrors.map((err) => (
                    <div key={err.id} className="flex gap-3 p-3 bg-error-container/10 rounded-lg border border-error-container/30">
                      <span className="material-symbols-outlined text-status-failed">error</span>
                      <div>
                        <p className="font-sans text-body-sm font-bold text-on-error-container">{err.event_type}</p>
                        <p className="text-on-surface-variant text-[12px] line-clamp-2">{err.message}</p>
                        <p className="text-outline text-[10px] mt-1">{formatTime(err.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Real-time Queue Table */}
          <section className="bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <div>
                <h3 className="font-display text-xl font-bold text-on-surface">Antrean Real-time</h3>
                <p className="text-on-surface-variant text-body-sm">Tugas penilaian dokumen aktif oleh AI</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/submit"
                  className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low border border-border-subtle rounded-lg text-body-sm hover:bg-surface-container-highest transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Kirim Jawaban Simulasi
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              {submissions.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-body-md opacity-60">
                  Belum ada berkas jawaban mahasiswa yang masuk. Silakan kirim data simulasi.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-muted text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">NIM</th>
                      <th className="px-6 py-4">Nama Mahasiswa</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Waktu Kirim</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4 font-mono text-code-sm">{sub.student_nim}</td>
                        <td className="px-6 py-4 font-semibold text-on-surface">
                          {sub.student_name}
                          <span className="block font-normal text-xs text-on-surface-variant opacity-80">
                            {sub.course_name} — {sub.exam_title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant text-body-sm">{sub.student_email}</td>
                        <td className="px-6 py-4">{renderStatusBadge(sub.status)}</td>
                        <td className="px-6 py-4 text-on-surface-variant text-body-sm">{formatTime(sub.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/review/${sub.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded text-xs font-bold transition-all hover:bg-primary-container active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Tinjau
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {submissions.length > 0 && (
              <div className="p-4 bg-surface-muted border-t border-border-subtle flex justify-between items-center text-body-sm text-on-surface-variant">
                <span>Menampilkan {submissions.length} dari {submissions.length} entri</span>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Batch Progress Overlay (Contextual Monitor) */}
      {stats.processing > 0 && (
        <div className="fixed bottom-6 right-6 w-80 bg-surface-container-lowest border border-border-subtle rounded-xl shadow-2xl p-4 transform translate-y-0 opacity-100 transition-all duration-500 z-[60]" id="progress-monitor">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-body-sm">Analisis Antrean Batch</h4>
            <button className="text-on-surface-variant hover:text-on-surface" onClick={() => {
              const el = document.getElementById('progress-monitor');
              if (el) el.style.display = 'none';
            }}>
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-on-surface-variant">Tugas Worker Aktif</span>
            <span className="text-[11px] font-bold text-primary">{stats.processing} aktif</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }}></div>
          </div>
          <p className="mt-2 text-[10px] text-on-surface-variant italic">Koreksi otomatis esai sedang diproses oleh Celery...</p>
        </div>
      )}
    </div>
  );
}
