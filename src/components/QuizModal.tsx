"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  HelpCircle,
  Clock,
  Award,
  Check,
  Layout,
  FileText,
  Save,
} from "lucide-react";
import axios from "axios";

interface Question {
  _id: number; // Internal unique ID for React state management
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

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  courseId: string;
  onSave: () => void;
}

export default function QuizModal({
  isOpen,
  onClose,
  moduleId,
  courseId,
  onSave,
}: QuizModalProps) {
  const [quizData, setQuizData] = useState<QuizData>({
    title: "",
    timeLimit: 10,
    passingScore: 70,
    questions: [],
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      _id: Date.now() + Math.random(), // Unique ID for React state
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
    try {
      // Prepare questions for API: assign proper sequential questionNo and remove internal _id
      const questionsForApi = quizData.questions.map((q, index) => ({
        questionNo: index + 1,
        question: q.question,
        options: q.options,
        correctOption: q.correctOption,
        points: q.points,
        explanation: q.explanation,
      }));

      await axios.post(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
        title: quizData.title || "New Quiz",
        type: "quiz",
        timeLimit: quizData.timeLimit,
        passingScore: quizData.passingScore,
        questions: questionsForApi,
      });

      // Reset state
      setQuizData({
        title: "",
        timeLimit: 10,
        passingScore: 70,
        questions: [],
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving quiz", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ animationFillMode: "forwards" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Create Quiz</h3>
              <p className="text-blue-100 text-sm">
                Build an interactive assessment for your students
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quiz Settings Card */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-600" />
              Quiz Settings
            </h4>

            {/* Quiz Title */}
            <div>
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={quizData.timeLimit}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      timeLimit: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={quizData.passingScore}
                  onChange={(e) =>
                    setQuizData({
                      ...quizData,
                      passingScore: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Questions
                {quizData.questions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {quizData.questions.length}
                  </span>
                )}
              </h4>
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-semibold shadow-md shadow-blue-200 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              {quizData.questions.map((question, qIndex) => (
                <div
                  key={question._id}
                  className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors"
                >
                  {/* Question Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                        {qIndex + 1}
                      </div>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(
                            question._id,
                            "question",
                            e.target.value
                          )
                        }
                        placeholder="Enter your question"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white transition-all"
                      />
                      <button
                        onClick={() => deleteQuestion(question._id)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-5 space-y-4">
                    {/* Options */}
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-gray-600">
                        Answer Options (click to mark correct answer)
                      </label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuestion(
                                question._id,
                                "correctOption",
                                oIndex
                              )
                            }
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              question.correctOption === oIndex
                                ? "bg-green-500 border-green-500 scale-110 shadow-md shadow-green-200"
                                : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                            }`}
                          >
                            <Check
                              className={`w-4 h-4 transition-all ${question.correctOption === oIndex ? "text-white" : "text-transparent"}`}
                            />
                          </button>
                          <span className="text-sm font-bold text-gray-500 w-6">
                            {String.fromCharCode(65 + oIndex)}.
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
                            className={`flex-1 px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all ${
                              question.correctOption === oIndex
                                ? "border-green-300 bg-green-50"
                                : "border-gray-200"
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Explanation & Points */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Explanation (shown after answering)
                        </label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) =>
                            updateQuestion(
                              question._id,
                              "explanation",
                              e.target.value
                            )
                          }
                          placeholder="Explain why this is the correct answer..."
                          rows={2}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder:text-gray-400 resize-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Points
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              updateQuestion(
                                question._id,
                                "points",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 transition-all"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                            pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {quizData.questions.length === 0 && (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <h5 className="font-semibold text-gray-900 mb-1">
                    No questions yet
                  </h5>
                  <p className="text-gray-500 text-sm mb-4">
                    Click "Add Question" to create your first quiz question
                  </p>
                  <button
                    onClick={addQuestion}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Question
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={!quizData.title || quizData.questions.length === 0}
            className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              quizData.title && quizData.questions.length > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md shadow-green-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            Save Quiz
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
