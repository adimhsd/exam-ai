"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Course {
  id: string;
  code: string;
  name: string;
  lecturer_name: string;
}

interface Exam {
  id: string;
  course_id: string;
  title: string;
  date: string;
  is_active: boolean;
}

interface Rubric {
  id: string;
  question_number: number;
  question_text: string;
  answer_key: string;
  max_score: number;
  rubric_criteria?: string[];
}

export default function CoursesExamsPage() {
  const { authFetch } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamRubrics, setSelectedExamRubrics] = useState<Rubric[]>([]);
  const [activeRubricExamTitle, setActiveRubricExamTitle] = useState("");
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoursesAndExams = async () => {
    try {
      setIsLoading(true);
      const coursesRes = await authFetch(`${API_BASE_URL}/api/v1/courses`);
      const coursesData = await coursesRes.json();
      setCourses(coursesData);

      const examsRes = await authFetch(`${API_BASE_URL}/api/v1/exams`);
      const examsData = await examsRes.json();
      setExams(examsData);
    } catch (err) {
      console.error("Gagal mengambil data courses/exams:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndExams();
  }, []);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/seed`, {
        method: "POST",
      });
      if (res.ok) {
        alert("Demo data berhasil di-seed!");
        fetchCoursesAndExams();
      } else {
        alert("Gagal melakukan seeding data.");
      }
    } catch (err) {
      console.error("Error seeding data:", err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleManageRubric = async (examId: string, examTitle: string) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/exams/${examId}/rubrics`);
      if (res.ok) {
        const rubricsData = await res.json();
        setSelectedExamRubrics(rubricsData);
        setActiveRubricExamTitle(examTitle);
        setIsRubricModalOpen(true);
      }
    } catch (err) {
      console.error("Gagal memuat rubrik:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Side Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-sidebar-width flex-grow flex flex-col min-h-screen">
        {/* Header */}
        <Header title="Mata Kuliah & Ujian" />

        {/* Canvas Area */}
        <main className="p-margin-desktop max-w-container-max mx-auto w-full">
          {/* Action Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-4">
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="bg-primary text-white px-6 py-2.5 flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all font-semibold rounded-lg text-body-sm shadow"
              >
                <span className="material-symbols-outlined text-lg">database</span>
                {isSeeding ? "Menyemai..." : "Seed Data Demo"}
              </button>
            </div>
          </div>

          {/* Statistics Row (Bento Lite) */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-8">
            <div className="col-span-1 md:col-span-2 bg-primary-container text-on-primary-container p-6 rounded-xl flex flex-col justify-between overflow-hidden relative">
              <div className="z-10">
                <p className="text-xs font-semibold uppercase opacity-80 mb-1">Total Mahasiswa Aktif</p>
                <p className="text-display-lg font-display font-extrabold leading-tight">1.248</p>
              </div>
              <div className="mt-4 z-10 flex items-center gap-2 text-status-completed font-semibold">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span className="text-body-sm">+12% dari semester lalu</span>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined !text-9xl">groups</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase mb-1">Ujian Berlangsung</p>
                <p className="text-headline-lg font-display font-bold text-on-surface">{exams.length}</p>
              </div>
              <div className="mt-4 flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-status-processing"></div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-status-completed"></div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-status-queued"></div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase mb-1">Tingkat Akurasi AI</p>
                <p className="text-headline-lg font-display font-bold text-ai-confidence-high">98.2%</p>
              </div>
              <div className="mt-4 w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div className="bg-ai-confidence-high h-full w-[98%]"></div>
              </div>
            </div>
          </section>

          {/* Loading or Empty State */}
          {isLoading ? (
            <div className="text-center py-20 text-on-surface-variant">Memuat data kelas...</div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-white border border-border-subtle rounded-xl shadow-sm max-w-2xl mx-auto px-8">
              <span className="material-symbols-outlined text-6xl text-primary mb-4 opacity-60">school</span>
              <h3 className="font-display text-xl font-bold mb-2">Belum Ada Kelas atau Mata Kuliah</h3>
              <p className="text-on-surface-variant text-body-sm mb-6 max-w-sm mx-auto">
                Inisialisasi database dengan data demonstrasi bawaan untuk menguji fitur penulisan rubrik dan otomatisasi AI.
              </p>
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="bg-primary text-white px-8 py-3 font-semibold hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2 rounded-lg"
              >
                <span className="material-symbols-outlined">database</span>
                {isSeeding ? "Seeding..." : "Seed Demo Data Sekarang"}
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {courses.map((course) => {
                const courseExams = exams.filter((e) => e.course_id === course.id);

                return (
                  <section key={course.id} className="border-b border-border-subtle pb-8 last:border-0">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-lg shadow-sm">
                          <span className="material-symbols-outlined text-2xl">
                            {course.code === "CS-202" ? "database" : "code"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-bold text-on-surface">{course.name}</h3>
                          <p className="text-on-surface-variant text-body-sm">
                            Kode Mata Kuliah: {course.code} • Dosen: {course.lecturer_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                      {courseExams.map((exam) => (
                        <div
                          key={exam.id}
                          className="bg-surface-container-lowest border border-border-subtle hover:border-primary transition-all p-6 group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="bg-status-completed/10 text-status-completed px-2.5 py-1 text-xs font-bold rounded uppercase tracking-wider">
                                Aktif
                              </span>
                            </div>
                            <h4 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                              {exam.title}
                            </h4>
                            <p className="text-on-surface-variant text-body-sm mb-6 line-clamp-2">
                              {course.code === "CS-202"
                                ? "Ujian praktikum tuning query, pembuatan indeks optimal, dan analisis normalisasi database."
                                : "Evaluasi kompetensi penulisan semantik HTML, flexbox/grid layout, dan transkripsi kriteria penilaian ujian."}
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-6">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-outline uppercase font-bold">Mahasiswa</span>
                                <span className="font-bold text-sm">312/320</span>
                              </div>
                              <div className="flex flex-col text-right">
                                <span className="text-[10px] text-outline uppercase font-bold">Rata-rata Nilai</span>
                                <span className="font-bold text-primary text-sm">82.4</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleManageRubric(exam.id, exam.title)}
                              className="w-full py-3 bg-surface-container-low text-primary font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-2 text-body-sm"
                            >
                              <span className="material-symbols-outlined text-sm">rule</span>
                              Kelola Rubrik
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Exam Dummy Card */}
                      <button className="border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-6 text-on-surface-variant hover:bg-surface-container-low hover:border-primary hover:text-primary transition-all group min-h-[260px]">
                        <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-on-primary">
                          <span className="material-symbols-outlined">add</span>
                        </div>
                        <span className="font-bold text-body-sm">Buat Ujian Baru</span>
                        <span className="text-xs opacity-60">Tambah untuk {course.name}</span>
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Rubric View Modal */}
      {isRubricModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-primary text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-display text-lg font-bold">{activeRubricExamTitle}</h3>
                <p className="text-xs opacity-80">Konfigurasi Rubrik Penilaian AI</p>
              </div>
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {selectedExamRubrics.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant">Belum ada rubrik terdaftar untuk ujian ini.</div>
              ) : (
                selectedExamRubrics.map((rubric) => (
                  <div key={rubric.id} className="border border-border-subtle p-4 rounded-lg bg-surface-container-low">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">Soal #{rubric.question_number}</span>
                      <span className="text-xs font-bold bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded">
                        Maks: {rubric.max_score} Poin
                      </span>
                    </div>
                    <p className="font-bold text-body-sm mb-2">{rubric.question_text}</p>
                    <div className="text-xs bg-white border border-border-subtle p-3 rounded space-y-2">
                      <div>
                        <span className="text-[10px] text-outline uppercase font-bold block mb-1">Kunci Jawaban</span>
                        <p className="font-mono text-on-surface-variant whitespace-pre-wrap">{rubric.answer_key}</p>
                      </div>
                      {rubric.rubric_criteria && rubric.rubric_criteria.length > 0 && (
                        <div>
                          <span className="text-[10px] text-outline uppercase font-bold block mb-1">Kriteria Kunci Penilaian</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {rubric.rubric_criteria.map((c, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border-subtle bg-surface flex justify-end">
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="bg-primary text-white px-6 py-2 rounded font-semibold text-body-sm shadow"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
