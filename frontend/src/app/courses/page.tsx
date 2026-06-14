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

  // States for new question form
  const [activeExamId, setActiveExamId] = useState("");
  const [newQuestionNumber, setNewQuestionNumber] = useState(1);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newAnswerKey, setNewAnswerKey] = useState("");
  const [newMaxScore, setNewMaxScore] = useState(5);
  const [newRubricCriteria, setNewRubricCriteria] = useState<string[]>([]);
  const [newCriteriaInput, setNewCriteriaInput] = useState("");
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // States for criteria inputs and saving status in existing rubrics
  const [newCriteriaInputs, setNewCriteriaInputs] = useState<Record<string, string>>({});
  const [isSavingRubric, setIsSavingRubric] = useState<Record<string, boolean>>({});

  // States for creating exam modal
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);
  const [createExamCourseId, setCreateExamCourseId] = useState("");
  const [createExamCourseName, setCreateExamCourseName] = useState("");
  const [createExamTitle, setCreateExamTitle] = useState("");
  const [createExamDate, setCreateExamDate] = useState("");
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  const handleOpenCreateExamModal = (courseId: string, courseName: string) => {
    setCreateExamCourseId(courseId);
    setCreateExamCourseName(courseName);
    setCreateExamTitle("");
    const today = new Date().toISOString().split("T")[0];
    setCreateExamDate(today);
    setIsCreateExamModalOpen(true);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createExamTitle.trim() || !createExamDate) {
      alert("Semua kolom formulir wajib diisi.");
      return;
    }
    setIsCreatingExam(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createExamTitle,
          date: createExamDate,
          is_active: true,
          course_id: createExamCourseId,
        }),
      });
      if (res.ok) {
        alert("Ujian baru berhasil dibuat!");
        setIsCreateExamModalOpen(false);
        setCreateExamTitle("");
        fetchCoursesAndExams();
      } else {
        const err = await res.json();
        alert(`Gagal membuat ujian: ${err.detail || "Error server"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsCreatingExam(false);
    }
  };

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

  const handleRubricFieldChange = (rubricId: string, field: keyof Rubric, value: any) => {
    setSelectedExamRubrics(prev =>
      prev.map(r => (r.id === rubricId ? { ...r, [field]: value } : r))
    );
  };

  const handleRemoveCriteria = (rubricId: string, indexToRemove: number) => {
    setSelectedExamRubrics(prev =>
      prev.map(r => {
        if (r.id === rubricId) {
          const criteria = r.rubric_criteria ? [...r.rubric_criteria] : [];
          criteria.splice(indexToRemove, 1);
          return { ...r, rubric_criteria: criteria };
        }
        return r;
      })
    );
  };

  const handleNewCriteriaTextChange = (rubricId: string, text: string) => {
    setNewCriteriaInputs(prev => ({ ...prev, [rubricId]: text }));
  };

  const handleAddCriteria = (rubricId: string) => {
    const text = (newCriteriaInputs[rubricId] || "").trim();
    if (!text) return;
    setSelectedExamRubrics(prev =>
      prev.map(r => {
        if (r.id === rubricId) {
          const criteria = r.rubric_criteria ? [...r.rubric_criteria] : [];
          if (!criteria.includes(text)) {
            criteria.push(text);
          }
          return { ...r, rubric_criteria: criteria };
        }
        return r;
      })
    );
    setNewCriteriaInputs(prev => ({ ...prev, [rubricId]: "" }));
  };

  const handleSaveRubric = async (rubric: Rubric) => {
    setIsSavingRubric(prev => ({ ...prev, [rubric.id]: true }));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/rubrics/${rubric.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_number: rubric.question_number,
          question_text: rubric.question_text,
          answer_key: rubric.answer_key,
          max_score: rubric.max_score,
          rubric_criteria: rubric.rubric_criteria || [],
        }),
      });
      if (res.ok) {
        alert(`Soal #${rubric.question_number} berhasil disimpan!`);
      } else {
        alert("Gagal menyimpan soal.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingRubric(prev => ({ ...prev, [rubric.id]: false }));
    }
  };

  const handleDeleteRubric = async (rubricId: string, questionNumber: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Soal #${questionNumber}?`)) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/rubrics/${rubricId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert(`Soal #${questionNumber} berhasil dihapus!`);
        setSelectedExamRubrics(prev => prev.filter(r => r.id !== rubricId));
      } else {
        alert("Gagal menghapus soal.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const handleNewCriteriaAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newCriteriaInput.trim();
    if (text && !newRubricCriteria.includes(text)) {
      setNewRubricCriteria(prev => [...prev, text]);
      setNewCriteriaInput("");
    }
  };

  const handleNewCriteriaRemove = (index: number) => {
    setNewRubricCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim() || !newAnswerKey.trim()) {
      alert("Teks pertanyaan dan kunci jawaban wajib diisi.");
      return;
    }
    setIsAddingQuestion(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/rubrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_id: activeExamId,
          question_number: newQuestionNumber,
          question_text: newQuestionText,
          answer_key: newAnswerKey,
          max_score: newMaxScore,
          rubric_criteria: newRubricCriteria,
        }),
      });
      if (res.ok) {
        const newRubric = await res.json();
        alert("Soal baru berhasil ditambahkan!");
        setSelectedExamRubrics(prev => [...prev, newRubric].sort((a, b) => a.question_number - b.question_number));
        setNewQuestionText("");
        setNewAnswerKey("");
        setNewRubricCriteria([]);
        setNewCriteriaInput("");
        setNewQuestionNumber(prev => prev + 1);
      } else {
        alert("Gagal menambahkan soal baru.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleManageRubric = async (examId: string, examTitle: string) => {
    setActiveExamId(examId);
    setNewQuestionText("");
    setNewAnswerKey("");
    setNewRubricCriteria([]);
    setNewCriteriaInput("");
    
    try {
      const res = await authFetch(`${API_BASE_URL}/api/v1/exams/${examId}/rubrics`);
      if (res.ok) {
        const rubricsData = await res.json();
        setSelectedExamRubrics(rubricsData);
        setActiveRubricExamTitle(examTitle);
        setIsRubricModalOpen(true);
        // Set new question number to max + 1
        const maxNum = rubricsData.reduce((max: number, r: Rubric) => Math.max(max, r.question_number), 0);
        setNewQuestionNumber(maxNum + 1);
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

                      {/* Add Exam Card */}
                      <button
                        onClick={() => handleOpenCreateExamModal(course.id, course.name)}
                        className="border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-6 text-on-surface-variant hover:bg-surface-container-low hover:border-primary hover:text-primary transition-all group min-h-[260px]"
                      >
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

      {/* Rubric View/Edit Modal */}
      {isRubricModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
            <div className="bg-primary text-white p-6 flex justify-between items-center shadow-md">
              <div>
                <h3 className="font-display text-lg font-bold">{activeRubricExamTitle}</h3>
                <p className="text-xs opacity-80">Konfigurasi & Editor Rubrik Penilaian AI</p>
              </div>
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50">
              {/* Existing Rubrics Section */}
              <div className="space-y-6">
                <h4 className="font-display text-sm font-bold text-slate-700 border-b pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-primary">list_alt</span>
                  Daftar Pertanyaan & Rubrik Ujian
                </h4>
                {selectedExamRubrics.length === 0 ? (
                  <div className="text-center py-8 text-on-surface-variant bg-white rounded-lg border border-border-subtle">
                    Belum ada rubrik terdaftar untuk ujian ini.
                  </div>
                ) : (
                  selectedExamRubrics.map((rubric) => (
                    <div key={rubric.id} className="border border-border-subtle p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all space-y-4">
                      {/* Number and Max Score Header */}
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase text-slate-400">Soal #</span>
                          <input
                            type="number"
                            className="w-16 px-2.5 py-1 border border-border-subtle rounded text-sm font-bold focus:outline-none focus:border-primary text-center"
                            value={rubric.question_number}
                            onChange={(e) => handleRubricFieldChange(rubric.id, "question_number", parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase text-slate-400">Skor Maksimal:</span>
                          <input
                            type="number"
                            className="w-16 px-2.5 py-1 border border-border-subtle rounded text-sm font-bold focus:outline-none focus:border-primary text-center"
                            value={rubric.max_score}
                            onChange={(e) => handleRubricFieldChange(rubric.id, "max_score", parseInt(e.target.value) || 0)}
                          />
                          <span className="text-xs text-slate-400 font-semibold">Poin</span>
                        </div>
                      </div>

                      {/* Question Text and Answer Key */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Teks Pertanyaan</label>
                          <textarea
                            rows={3}
                            className="w-full text-xs text-on-surface bg-slate-50/50 p-2.5 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:bg-white resize-y"
                            value={rubric.question_text}
                            onChange={(e) => handleRubricFieldChange(rubric.id, "question_text", e.target.value)}
                            placeholder="Tulis pertanyaan ujian..."
                          ></textarea>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kunci Jawaban Acuan</label>
                          <textarea
                            rows={3}
                            className="w-full text-xs text-on-surface bg-slate-50/50 p-2.5 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:bg-white resize-y font-mono"
                            value={rubric.answer_key}
                            onChange={(e) => handleRubricFieldChange(rubric.id, "answer_key", e.target.value)}
                            placeholder="Tulis kunci jawaban..."
                          ></textarea>
                        </div>
                      </div>

                      {/* Criteria Tags Management */}
                      <div className="space-y-2 pt-2 border-t border-dashed border-border-subtle">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Kriteria Penilaian Kunci (Poin Penting untuk AI)</label>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {rubric.rubric_criteria && rubric.rubric_criteria.map((c, idx) => (
                            <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 pl-3 pr-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 hover:bg-slate-200 transition-colors">
                              {c}
                              <button
                                onClick={() => handleRemoveCriteria(rubric.id, idx)}
                                className="w-4 h-4 rounded-full bg-slate-300/60 hover:bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                          {/* New criteria input for this specific rubric card */}
                          <div className="flex items-center gap-1.5 ml-2">
                            <input
                              type="text"
                              className="px-3 py-1 border border-border-subtle rounded-full text-xs focus:outline-none focus:border-primary w-32 placeholder:text-slate-400"
                              placeholder="+ Tambah Kriteria"
                              value={newCriteriaInputs[rubric.id] || ""}
                              onChange={(e) => handleNewCriteriaTextChange(rubric.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddCriteria(rubric.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddCriteria(rubric.id)}
                              className="w-6 h-6 rounded-full bg-slate-200 hover:bg-primary hover:text-white flex items-center justify-center transition-all text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleDeleteRubric(rubric.id, rubric.question_number)}
                          className="px-4 py-2 border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Hapus Soal
                        </button>
                        <button
                          onClick={() => handleSaveRubric(rubric)}
                          disabled={isSavingRubric[rubric.id]}
                          className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow"
                        >
                          <span className="material-symbols-outlined text-sm">save</span>
                          {isSavingRubric[rubric.id] ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Question Section */}
              <div className="border border-dashed border-primary/40 p-6 rounded-xl bg-primary/5 hover:bg-primary/[0.08] transition-all space-y-4">
                <h4 className="font-display text-sm font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Tambah Soal Baru untuk Ujian Ini
                </h4>
                
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase text-slate-500">Soal #</span>
                    <input
                      type="number"
                      className="w-16 px-2.5 py-1 border border-border-subtle rounded bg-white text-sm font-bold focus:outline-none focus:border-primary text-center"
                      value={newQuestionNumber}
                      onChange={(e) => setNewQuestionNumber(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase text-slate-500">Skor Maksimal:</span>
                    <input
                      type="number"
                      className="w-16 px-2.5 py-1 border border-border-subtle rounded bg-white text-sm font-bold focus:outline-none focus:border-primary text-center"
                      value={newMaxScore}
                      onChange={(e) => setNewMaxScore(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-xs text-slate-500 font-semibold">Poin</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Teks Pertanyaan</label>
                    <textarea
                      rows={3}
                      className="w-full text-xs text-on-surface bg-white p-2.5 border border-border-subtle rounded-lg focus:outline-none focus:border-primary resize-y"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Masukkan pertanyaan esai baru..."
                    ></textarea>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Kunci Jawaban Acuan</label>
                    <textarea
                      rows={3}
                      className="w-full text-xs text-on-surface bg-white p-2.5 border border-border-subtle rounded-lg focus:outline-none focus:border-primary resize-y font-mono"
                      value={newAnswerKey}
                      onChange={(e) => setNewAnswerKey(e.target.value)}
                      placeholder="Masukkan kunci jawaban referensi..."
                    ></textarea>
                  </div>
                </div>

                {/* Add Criteria for new question */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Kriteria Penilaian Kunci (Poin Penting untuk AI)</label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {newRubricCriteria.map((c, idx) => (
                      <span key={idx} className="bg-primary-container/20 border border-primary-container/40 text-primary pl-3 pr-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5">
                        {c}
                        <button
                          type="button"
                          onClick={() => handleNewCriteriaRemove(idx)}
                          className="w-4 h-4 rounded-full bg-primary-container/40 hover:bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="text"
                        className="px-3 py-1 border border-border-subtle rounded-full text-xs focus:outline-none focus:border-primary w-36 bg-white placeholder:text-slate-400"
                        placeholder="+ Kriteria Baru"
                        value={newCriteriaInput}
                        onChange={(e) => setNewCriteriaInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const text = newCriteriaInput.trim();
                            if (text && !newRubricCriteria.includes(text)) {
                              setNewRubricCriteria(prev => [...prev, text]);
                              setNewCriteriaInput("");
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const text = newCriteriaInput.trim();
                          if (text && !newRubricCriteria.includes(text)) {
                            setNewRubricCriteria(prev => [...prev, text]);
                            setNewCriteriaInput("");
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleAddQuestion}
                    disabled={isAddingQuestion || !newQuestionText.trim() || !newAnswerKey.trim()}
                    className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow disabled:opacity-50 disabled:scale-100"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    {isAddingQuestion ? "Menambahkan..." : "Tambah Soal ke Ujian"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border-subtle bg-surface flex justify-end gap-3 shadow-lg">
              <button
                onClick={() => setIsRubricModalOpen(false)}
                className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold text-body-sm hover:bg-slate-300 transition-all active:scale-95"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Exam Modal */}
      {isCreateExamModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100">
            <div className="bg-primary text-white p-6 flex justify-between items-center shadow-md">
              <div>
                <h3 className="font-display text-lg font-bold">Buat Ujian Baru</h3>
                <p className="text-xs opacity-80">Mata Kuliah: {createExamCourseName}</p>
              </div>
              <button
                onClick={() => setIsCreateExamModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateExam} className="p-6 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Judul Ujian</label>
                <input
                  type="text"
                  required
                  className="w-full text-sm text-on-surface bg-slate-50/50 p-3 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all"
                  placeholder="Misal: Ujian Akhir Semester: Pemrograman Lanjut"
                  value={createExamTitle}
                  onChange={(e) => setCreateExamTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  required
                  className="w-full text-sm text-on-surface bg-slate-50/50 p-3 border border-border-subtle rounded-lg focus:outline-none focus:border-primary focus:bg-white transition-all"
                  value={createExamDate}
                  onChange={(e) => setCreateExamDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateExamModalOpen(false)}
                  className="px-5 py-2.5 border border-outline-variant text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingExam || !createExamTitle.trim() || !createExamDate}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {isCreatingExam ? "Membuat..." : "Buat Ujian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
