"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Award,
  Check,
  Layout,
  FileText,
  Save,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/axios";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Question {
  _id: number;
  questionNo: number;
  question: string;
  options: string[];
  correctOption: number;
  points: number;
  explanation: string;
}

interface QuizData {
  title: string;
  timeLimit: number;
  passingScore: number;
  questions: Question[];
}

function EditQuizContent() {
  const router = useRouter();
  const { courseId } = useParams();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  const [quizData, setQuizData] = useState<QuizData>({
    title: "",
    timeLimit: 10,
    passingScore: 70,
    questions: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!moduleId || !lessonId) {
      router.push(`/courses/${courseId}`);
      return;
    }

    const fetchQuizData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );

        if (res.data.success) {
          const lesson = res.data.data.lesson;
          const quiz = lesson.quizId;

          if (quiz) {
            setQuizData({
              title: lesson.title || "",
              timeLimit: quiz.timeLimit || 10,
              passingScore: quiz.passingScore || 70,
              questions: quiz.questions.map((q: any, index: number) => ({
                _id: Date.now() + index + Math.random(),
                questionNo: q.questionNo || index + 1,
                question: q.question || "",
                options: q.options || ["", "", "", ""],
                correctOption: q.correctOption || 0,
                points: q.points || 10,
                explanation: q.explanation || "",
              })),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        alert("Failed to load quiz data");
        router.push(`/courses/${courseId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [moduleId, lessonId, courseId, router]);

  const addQuestion = () => {
    const newQuestion: Question = {
      _id: Date.now() + Math.random(),
      questionNo: quizData.questions.length + 1,
      question: "",
      options: ["", "", "", ""],
      correctOption: 0,
      points: 10,
      explanation: "",
    };
    setQuizData({
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    });
  };

  const updateQuestion = (id: number, field: keyof Question, value: any) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) =>
        q._id === id ? { ...q, [field]: value } : q
      ),
    });
  };

  const updateQuestionOption = (
    id: number,
    optionIndex: number,
    value: string
  ) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions.map((q) => {
        if (q._id === id) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }),
    });
  };

  const deleteQuestion = (id: number) => {
    setQuizData({
      ...quizData,
      questions: quizData.questions
        .filter((q) => q._id !== id)
        .map((q, index) => ({ ...q, questionNo: index + 1 })),
    });
  };

  const handleSave = async () => {
    if (!moduleId || !courseId || !lessonId) return;

    try {
      setIsSaving(true);

      const questionsForApi = quizData.questions.map((q, index) => ({
        questionNo: index + 1,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        points: q.points,
        explanation: q.explanation,
      }));

      // Update lesson title
      await api.patch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        { title: quizData.title || "Quiz" }
      );

      // Update quiz data
      await api.patch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/update-quiz`,
        {
          timeLimit: quizData.timeLimit,
          passingScore: quizData.passingScore,
          questions: questionsForApi,
        }
      );

      router.push(`/courses/${courseId}?expandedModule=${moduleId}`);
    } catch (error) {
      console.error("Error updating quiz", error);
      alert("Failed to update quiz. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!moduleId || !lessonId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/courses/${courseId}`}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Edit Quiz</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/courses/${courseId}`}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={
                isSaving || !quizData.title || quizData.questions.length === 0
              }
              className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${
                isSaving || !quizData.title || quizData.questions.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 cursor-pointer"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Quiz Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Quiz Settings</h2>
              <p className="text-sm text-gray-500">
                Basic configuration for the quiz
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) =>
                  setQuizData({ ...quizData, title: e.target.value })
                }
                placeholder="e.g., Module 1 Assessment"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={quizData.timeLimit || ""}
                onChange={(e) =>
                  setQuizData({
                    ...quizData,
                    timeLimit: e.target.valueAsNumber || 0,
                  })
                }
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-500" />
                Passing Score (%)
              </label>
              <input
                type="number"
                value={quizData.passingScore || ""}
                onChange={(e) =>
                  setQuizData({
                    ...quizData,
                    passingScore: e.target.valueAsNumber || 0,
                  })
                }
                min="0"
                max="100"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Questions</h2>
                <p className="text-sm text-gray-500">
                  {quizData.questions.length} question
                  {quizData.questions.length !== 1 ? "s" : ""} added
                </p>
              </div>
            </div>
            <button
              onClick={addQuestion}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium shadow-lg shadow-gray-200 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>

          <div className="space-y-6">
            {quizData.questions.map((question, qIndex) => (
              <div
                key={question._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Question Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-start gap-4">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-sm">
                    {qIndex + 1}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question._id, "question", e.target.value)
                      }
                      placeholder="Enter your question here..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400 bg-white resize-none text-base font-medium"
                    />
                  </div>
                  <button
                    onClick={() => deleteQuestion(question._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Question Content */}
                <div className="p-6 space-y-6">
                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          question.correctOption === oIndex
                            ? "border-green-500 bg-green-50/50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <button
                          onClick={() =>
                            updateQuestion(
                              question._id,
                              "correctOption",
                              oIndex
                            )
                          }
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                            question.correctOption === oIndex
                              ? "bg-green-500 border-green-500 shadow-sm"
                              : "border-gray-300 hover:border-green-400"
                          }`}
                          title="Mark as correct answer"
                        >
                          <Check
                            className={`w-3 h-3 transition-all ${
                              question.correctOption === oIndex
                                ? "text-white"
                                : "text-transparent"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-bold text-gray-400 w-5">
                          {String.fromCharCode(65 + oIndex)}
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateQuestionOption(
                              question._id,
                              oIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 placeholder:text-gray-400 font-medium outline-none shadow-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Settings Footer */}
                  <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={question.explanation}
                        onChange={(e) =>
                          updateQuestion(
                            question._id,
                            "explanation",
                            e.target.value
                          )
                        }
                        placeholder="Explain why this answer is correct..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-700"
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Points
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={question.points || ""}
                          onChange={(e) =>
                            updateQuestion(
                              question._id,
                              "points",
                              e.target.valueAsNumber || 0
                            )
                          }
                          className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-semibold text-gray-900"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                          pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State or Bottom Add Button */}
            {quizData.questions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  No questions yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Start building your quiz by adding questions. You can create
                  multiple choice questions with explanations.
                </p>
                <button
                  onClick={addQuestion}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg shadow-gray-200 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add First Question
                </button>
              </div>
            ) : (
              <div className="flex justify-center pt-4">
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black font-bold shadow-lg shadow-gray-200 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Add Question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <EditQuizContent />
    </Suspense>
  );
}
