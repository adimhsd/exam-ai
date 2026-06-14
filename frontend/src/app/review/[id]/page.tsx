"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ScoreItem {
  question_number: number;
  score: number;
  max_score: number;
  criteria_met: string[];
  feedback: string;
}

interface GradingResult {
  id: string;
  submission_id: string;
  raw_ocr_text: string;
  scores_breakdown: ScoreItem[];
  total_score: number;
  overall_feedback: string;
  confidence_score: number;
  is_reviewed: boolean;
  final_score: number;
}

interface SubmissionDetail {
  id: string;
  student_nim: string;
  student_name: string;
  student_email: string;
  file_url: string;
  status: string;
  created_at: string;
  exam_title: string;
  course_name: string;
  grading_result: GradingResult | null;
}

export default function GradingReviewPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const { authFetch } = useAuth();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [rawOcr, setRawOcr] = useState("");
  
  const [leftWidth, setLeftWidth] = useState(50); // percentage for split screen
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch submission details
  const fetchSubmissionDetail = async () => {
    try {
      setIsLoading(true);
      const res = await authFetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}`);
      if (!res.ok) throw new Error("Gagal mengambil detail submission");
      const data: SubmissionDetail = await res.json();
      setSubmission(data);
      if (data.grading_result) {
        setScores(data.grading_result.scores_breakdown || []);
        setOverallFeedback(data.grading_result.overall_feedback || "");
        setRawOcr(data.grading_result.raw_ocr_text || "");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading submission details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissionDetail();
  }, [submissionId]);

  // Handle Drag Resizer
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const sidebarWidth = 72; // Sidebar collapsed width in review screen
      const containerWidth = document.body.clientWidth - sidebarWidth;
      const percentage = ((moveEvent.clientX - sidebarWidth) / containerWidth) * 100;
      if (percentage > 20 && percentage < 80) {
        setLeftWidth(percentage);
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Change individual score
  const handleScoreChange = (qNum: number, value: number) => {
    setScores(prev =>
      prev.map(item =>
        item.question_number === qNum ? { ...item, score: value } : item
      )
    );
  };

  // Change individual feedback
  const handleFeedbackChange = (qNum: number, value: string) => {
    setScores(prev =>
      prev.map(item =>
        item.question_number === qNum ? { ...item, feedback: value } : item
      )
    );
  };

  // Trigger retry/reprocess Celery task
  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}/process`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Proses ulang berhasil dipicu! Halaman akan dimuat ulang ketika selesai.");
        // Poll status
        const poll = setInterval(async () => {
          const check = await authFetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}`);
          const cData: SubmissionDetail = await check.json();
          if (cData.status === "COMPLETED" || cData.status === "FAILED") {
            clearInterval(poll);
            fetchSubmissionDetail();
            setIsReprocessing(false);
          }
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setIsReprocessing(false);
    }
  };

  // Save reviewed scores and send Email
  const handleApproveAndSend = async () => {
    setIsSaving(true);
    try {
      const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
      const payload = {
        scores_breakdown: scores,
        total_score: totalScore,
        overall_feedback: overallFeedback || "Pemeriksaan selesai. Jawaban dievaluasi dengan baik.",
        final_score: totalScore,
        is_reviewed: true,
      };

      const res = await authFetch(`${API_BASE_URL}/api/v1/submissions/${submissionId}/grading`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Hasil penilaian berhasil disimpan dan email laporan telah dikirim!");
        router.push("/");
      } else {
        alert("Gagal menyimpan penilaian.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-on-surface-variant font-semibold">
        Memuat berkas ujian mahasiswa...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-bold text-status-failed mb-4">Submission Tidak Ditemukan</p>
          <Link href="/" className="bg-primary text-white px-6 py-2 rounded">Kembali ke Dasbor</Link>
        </div>
      </div>
    );
  }

  const confidenceScore = submission.grading_result?.confidence_score
    ? floatPercent(submission.grading_result.confidence_score)
    : 0;

  function floatPercent(val: any) {
    const f = parseFloat(val);
    if (f <= 1.0) return Math.round(f * 100);
    return Math.round(f);
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Header / Top Navigation */}
      <header className="flex justify-between items-center h-16 px-margin-desktop w-full bg-surface border-b border-border-subtle shadow-sm z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-headline-md font-bold text-primary hover:opacity-85">
            exam-ai
          </Link>
          <div className="hidden md:flex gap-6 items-center border-l border-border-subtle pl-6">
            <span className="text-on-surface-variant font-sans text-[10px] font-bold uppercase tracking-widest">Penilaian Aktif</span>
            <div className="flex items-center gap-2 text-body-sm">
              <span className="font-bold text-primary truncate max-w-xs">{submission.student_name}</span>
              <span className="text-on-surface-variant opacity-60">/ NIM: {submission.student_nim}</span>
              <span className="text-on-surface-variant opacity-60">/ Akurasi AI: {confidenceScore}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 px-3 py-1 bg-surface-container-high rounded-full items-center">
            <span
              className={`material-symbols-outlined text-[18px] ${
                submission.status === "COMPLETED" ? "text-status-completed" : "text-status-processing"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {submission.status === "COMPLETED" ? "check_circle" : "sync"}
            </span>
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">{submission.status}</span>
          </div>
          <Link href="/" className="p-2 hover:bg-surface-container-low transition-all rounded-full" title="Dasbor">
            <span className="material-symbols-outlined text-on-surface-variant">dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Left SideNav (Icons Only for Focus) */}
        <nav className="hidden lg:flex flex-col w-[72px] border-r border-border-subtle bg-surface h-full py-4 items-center gap-6">
          <Link href="/" className="text-on-surface-variant hover:bg-surface-container-highest rounded-lg p-3">
            <span className="material-symbols-outlined">dashboard</span>
          </Link>
          <Link href="/courses" className="text-on-surface-variant hover:bg-surface-container-highest rounded-lg p-3">
            <span className="material-symbols-outlined">school</span>
          </Link>
        </nav>

        {/* Split Container */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Left panel: Document Viewer */}
          <section className="flex flex-col bg-surface-dim overflow-hidden relative" style={{ width: `${leftWidth}%` }}>
            <div className="bg-surface h-12 border-b border-border-subtle flex items-center justify-between px-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-surface-container-low" title="Zoom Out">
                  <span className="material-symbols-outlined text-on-surface-variant">zoom_out</span>
                </button>
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-surface-container-low" title="Zoom In">
                  <span className="material-symbols-outlined text-on-surface-variant">zoom_in</span>
                </button>
                <div className="h-4 w-[1px] bg-border-subtle mx-2"></div>
                <span className="text-xs font-semibold">Skala: {zoom}%</span>
              </div>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex items-center gap-1 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">rotate_right</span>
                Putar
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-200">
              <div
                className="bg-white shadow-xl relative transition-transform duration-300"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "top center",
                  width: "100%",
                  maxWidth: "650px",
                }}
              >
                {/* Visual Exam sheet from URL */}
                <img
                  className="w-full h-auto object-contain"
                  alt="Salinan pemindaian lembar jawaban mahasiswa"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJeW-2Hmai7cJeF62KDn9Xl2oUjbFFBwAXx_QTTpraybbtF_S4A9fT429WU8sgkIkqTwMkQJHdbqlVzZ8PJMZxE72TswIPUK6tWjkIzzXtSzwprmnEid6MZo7NdFJo89OgN1YHjTcIPh8CKwZsASLWEB1tRKt4XdPw2hh9KeFimcA36F38061-Nb_qsNqqiMLOkeFoiBXkPUgdaUn0RX_XnDQijl6sWrudoHeIW4isccYc0iaOWZ2P1HxVlDtwW7YsaKM6Mqv-mPk"
                />
              </div>
            </div>
          </section>

          {/* Draggable Resizer Bar */}
          <div
            className="w-1.5 h-full bg-border-subtle hover:bg-primary cursor-col-resize transition-colors z-10"
            onMouseDown={handleMouseDown}
          ></div>

          {/* Right panel: Grading & OCR Panel */}
          <section className="flex-grow flex flex-col bg-white overflow-hidden" style={{ width: `${100 - leftWidth}%` }}>
            <div className="bg-surface h-12 border-b border-border-subtle flex items-center justify-between px-6">
              <h2 className="font-display text-body-md font-bold text-on-surface">Lembar Penilaian Nilai & Evaluasi</h2>
              <div className="flex gap-4 items-center">
                <span className="text-body-sm text-on-surface-variant">
                  Total Nilai: <span className="font-bold text-on-surface">
                    {scores.reduce((sum, item) => sum + item.score, 0).toFixed(1)}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overall Confidence Indicator */}
              <div className="bg-surface-muted p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
                <div className="flex justify-between text-body-sm">
                  <span className="font-semibold text-on-surface-variant">Tingkat Keyakinan Transkripsi AI</span>
                  <span className={`font-bold ${confidenceScore >= 80 ? "text-ai-confidence-high" : "text-ai-confidence-low"}`}>
                    {confidenceScore >= 80 ? "Tinggi" : "Rendah"} ({confidenceScore}%)
                  </span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      confidenceScore >= 80 ? "bg-ai-confidence-high" : "bg-ai-confidence-low"
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Status failed warning */}
              {submission.status === "FAILED" && (
                <div className="bg-status-failed/10 border border-status-failed/30 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-status-failed">warning</span>
                  <div>
                    <h4 className="font-bold text-status-failed text-body-sm">Proses OCR / AI Gagal</h4>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Terjadi gangguan koneksi API atau format dokumen tidak dapat diurai oleh OCR.
                    </p>
                    <button
                      onClick={handleReprocess}
                      disabled={isReprocessing}
                      className="mt-3 bg-status-failed text-white px-4 py-1.5 text-xs font-bold rounded hover:opacity-90 active:scale-95 transition-all"
                    >
                      {isReprocessing ? "Memproses..." : "Coba Ulang Pemrosesan AI"}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state: Waiting OCR */}
              {submission.status === "QUEUED" && (
                <div className="text-center py-20">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                  <p className="font-bold text-body-sm text-on-surface-variant">Dokumen sedang mengantre untuk pemrosesan OCR.</p>
                </div>
              )}

              {/* Loop Question Grading Cards */}
              {scores.map((item) => (
                <div
                  key={item.question_number}
                  className="grading-card rounded-xl border border-border-subtle focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-sans text-primary uppercase text-[10px] font-extrabold tracking-widest block mb-1">
                        Soal {String(item.question_number).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-body-md font-bold text-on-surface">
                        {item.question_number === 1 && "Definisikan Hukum Kedua Termodinamika."}
                        {item.question_number === 2 && "Hitung efisiensi mesin kalor."}
                        {item.question_number === 3 && "Jelaskan tahapan Siklus Carnot."}
                        {item.question_number > 3 && "Soal Ujian Esai"}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <input
                          className="w-16 text-right font-bold text-lg border border-border-subtle bg-surface-container-low rounded-lg p-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
                          step="0.5"
                          type="number"
                          min="0"
                          max={item.max_score}
                          value={item.score}
                          onChange={(e) => handleScoreChange(item.question_number, parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-body-sm text-outline-variant font-semibold">/ {item.max_score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-on-surface-variant mb-1.5 block tracking-wider">
                      HASIL TRANSKRIPSI OCR (BISA DIEDIT)
                    </label>
                    <div className="font-mono text-xs text-on-surface bg-surface-muted p-3 border border-border-subtle rounded-lg whitespace-pre-wrap">
                      {rawOcr ? (
                        "Hasil ekstraksi teks OCR visual lengkap dapat diedit di kolom teks utama."
                      ) : (
                        "Tidak ada teks terdeteksi."
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-ai-confidence-high/5 rounded-lg border border-ai-confidence-high/20">
                      <p className="text-[10px] font-bold text-ai-confidence-high mb-1 uppercase tracking-wider">Analisis & Umpan Balik AI</p>
                      <p className="text-xs leading-relaxed text-on-surface">{item.feedback || "Jawaban dianalisis secara otomatis berdasarkan rubrik kriteria poin."}</p>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg border border-border-subtle">
                      <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Kriteria Terpenuhi</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.criteria_met && item.criteria_met.length > 0 ? (
                          item.criteria_met.map((c, i) => (
                            <span key={i} className="bg-white border border-border-subtle text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                              ✓ {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-outline italic">Kriteria penilaian tidak terpenuhi</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lecturer Custom Feedback Field */}
                  <div className="mt-4 pt-4 border-t border-dashed border-border-subtle">
                    <label className="text-[10px] font-bold text-on-surface-variant mb-1 block">UMPAN BALIK KOREKSI MANUAL DOSEN</label>
                    <input
                      className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:outline-none py-1.5 text-xs font-sans text-on-surface placeholder:text-outline/60"
                      placeholder="Tambahkan catatan koreksi dari dosen..."
                      type="text"
                      value={item.feedback}
                      onChange={(e) => handleFeedbackChange(item.question_number, e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {/* Overall Feedback Form */}
              {scores.length > 0 && (
                <div className="border border-border-subtle rounded-xl p-6 bg-surface-container-low">
                  <h3 className="font-display text-body-md font-bold mb-2 text-on-surface">Umpan Balik Evaluasi Keseluruhan</h3>
                  <textarea
                    rows={3}
                    className="w-full border border-border-subtle rounded-lg p-3 text-body-sm font-sans focus:outline-none focus:border-primary resize-none placeholder:text-outline/60"
                    placeholder="Tulis ringkasan feedback untuk dikirimkan melalui email ke mahasiswa..."
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                  ></textarea>
                </div>
              )}
            </div>

            {/* Sticky Footer Actions */}
            <div className="h-24 border-t border-border-subtle bg-surface px-8 flex items-center justify-between z-10 shadow-lg">
              <div className="flex gap-4">
                <button
                  onClick={handleReprocess}
                  disabled={isReprocessing}
                  className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant rounded-lg font-bold text-xs hover:bg-surface-container-highest transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">sync</span>
                  {isReprocessing ? "Memproses AI..." : "Hitung Ulang AI"}
                </button>
                <Link
                  href="/"
                  className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant rounded-lg font-bold text-xs hover:bg-surface-container-highest transition-all"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  Batal
                </Link>
              </div>
              <button
                onClick={handleApproveAndSend}
                disabled={isSaving || scores.length === 0}
                className="flex items-center gap-3 px-8 py-3 bg-primary text-white rounded-lg font-bold text-body-sm shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? "Menyimpan..." : "Setujui & Kirim Email"}
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
