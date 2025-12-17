"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  Trophy,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/axios";

interface Response {
  questionId: number;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

interface QuizAttempt {
  _id: string;
  student: string;
  quizId: string;
  responses: Response[];
  score: number;
  totalPoints: number;
  passed: boolean;
  status: "in_progress" | "completed";
  startedAt: string;
  submittedAt?: string;
}

interface Question {
  questionNo: number;
  question: string;
  options: string[];
  correctOption: number;
  points: number;
  explanation: string;
}

interface Quiz {
  _id: string;
  timeLimit: number;
  passingScore: number;
  questions: Question[];
}

export default function QuizResultPage() {
  const { courseId, attemptId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const fetchAttemptDetails = async () => {
      if (!courseId || !moduleId || !lessonId || !attemptId) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const attemptRes = await api.get(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz-result/${attemptId}`
        );

        if (attemptRes.data.success) {
          setAttempt(attemptRes.data.data);

          const lessonRes = await api.get(
            `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
          );

          if (lessonRes.data.success && lessonRes.data.data.lesson.quizId) {
            setQuiz(lessonRes.data.data.lesson.quizId);
          }
        } else {
          setError(
            attemptRes.data.message || "Failed to fetch attempt details"
          );
        }
      } catch (err: any) {
        console.error("Error fetching attempt details:", err);
        setError(
          err.response?.data?.message ||
            "An error occurred while loading the attempt details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttemptDetails();
  }, [courseId, moduleId, lessonId, attemptId]);

  const toggleQuestion = (questionNo: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionNo)) {
        newSet.delete(questionNo);
      } else {
        newSet.add(questionNo);
      }
      return newSet;
    });
  };

  const handleGoBack = () => {
    router.push(
      `/courses/${courseId}/learn?moduleId=${moduleId}&lessonId=${lessonId}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center p-6 bg-gray-800 rounded-xl border border-gray-700 max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  const correctAnswers = attempt.responses.filter((r) => r.isCorrect).length;
  const totalQuestions = attempt.responses.length;
  const percentage = Math.round((attempt.score / attempt.totalPoints) * 100);

  const getQuestionFromQuiz = (questionNo: number): Question | undefined => {
    return quiz?.questions.find((q) => q.questionNo === questionNo);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Lesson</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Result Summary Card */}
        <div
          className={`rounded-2xl border p-6 mb-8 ${
            attempt.passed
              ? "bg-green-900/20 border-green-700"
              : "bg-red-900/20 border-red-700"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {attempt.passed ? (
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-green-400" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    attempt.passed ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {attempt.passed ? "Quiz Passed!" : "Quiz Failed"}
                </h1>
                <p className="text-gray-400 mt-1">
                  {attempt.passed
                    ? "Great job! You've successfully completed this quiz."
                    : "Don't give up! Review your answers and try again."}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${
                  attempt.passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {percentage}%
              </div>
              <div className="text-gray-500 text-sm">Score</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-white">
              {attempt.score}/{attempt.totalPoints}
            </div>
            <div className="text-gray-500 text-sm">Points Earned</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {correctAnswers}
            </div>
            <div className="text-gray-500 text-sm">Correct Answers</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-red-400">
              {totalQuestions - correctAnswers}
            </div>
            <div className="text-gray-500 text-sm">Wrong Answers</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {attempt.submittedAt
                ? new Date(attempt.submittedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "-"}
            </div>
            <div className="text-gray-500 text-sm">Submitted On</div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Review Answers</h2>
          {attempt.responses.map((response, index) => {
            const question = getQuestionFromQuiz(response.questionId);
            const isExpanded = expandedQuestions.has(response.questionId);

            return (
              <div
                key={response.questionId}
                className={`rounded-xl border overflow-hidden ${
                  response.isCorrect
                    ? "border-green-700/50 bg-gray-800/50"
                    : "border-red-700/50 bg-gray-800/50"
                }`}
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(response.questionId)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {response.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <span className="text-gray-400 text-sm">
                        Question {index + 1}
                      </span>
                      <p className="text-white font-medium line-clamp-1">
                        {question?.question ||
                          `Question #${response.questionId}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        response.isCorrect ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {response.points}/{question?.points || response.points}{" "}
                      pts
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && question && (
                  <div className="px-4 pb-4 border-t border-gray-700">
                    <div className="pt-4 space-y-3">
                      {question.options.map((option, optIndex) => {
                        const isSelected = response.selectedOption === optIndex;
                        const isCorrect = response.correctOption === optIndex;

                        let bgClass = "bg-gray-700/30";
                        let borderClass = "border-gray-600";

                        if (isCorrect) {
                          bgClass = "bg-green-900/30";
                          borderClass = "border-green-500";
                        } else if (isSelected && !response.isCorrect) {
                          bgClass = "bg-red-900/30";
                          borderClass = "border-red-500";
                        }

                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg border ${bgClass} ${borderClass} flex items-center gap-3`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : isSelected
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-600 text-gray-300"
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span
                              className={`${
                                isCorrect
                                  ? "text-green-300"
                                  : isSelected && !response.isCorrect
                                    ? "text-red-300"
                                    : "text-gray-300"
                              }`}
                            >
                              {option}
                            </span>
                            {isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                            )}
                            {isSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-red-400 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {response.explanation && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">
                          Explanation:
                        </p>
                        <p className="text-blue-200">{response.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Back to Lesson
          </button>
          {!attempt.passed && (
            <button
              onClick={() => {
                router.push(
                  `/courses/${courseId}/learn?moduleId=${moduleId}&lessonId=${lessonId}`
                );
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
