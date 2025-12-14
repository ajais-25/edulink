"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import QuizInterface from "@/components/QuizInterface";
import api from "@/lib/axios";

export default function QuizPage() {
  const { courseId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const moduleId = searchParams.get("moduleId");
  const lessonId = searchParams.get("lessonId");

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!courseId || !moduleId || !lessonId) {
        setError(
          "Missing required parameters: courseId, moduleId, or lessonId"
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Using existing API as requested
        const res = await api.get(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );

        if (res.data.success) {
          const fetchedQuiz = res.data.data.lesson.quizId;
          if (fetchedQuiz) {
            setQuiz(fetchedQuiz);
          } else {
            setError("Quiz not found in lesson data");
          }
        } else {
          setError(res.data.message || "Failed to fetch quiz");
        }
      } catch (err: any) {
        console.error("Error fetching quiz:", err);
        setError(
          err.response?.data?.message ||
            "An error occurred while loading the quiz"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [courseId, moduleId, lessonId]);

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
          <h2 className="text-xl font-bold text-red-500 mb-2">
            Error Loading Quiz
          </h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <QuizInterface quiz={quiz} onExit={() => router.back()} />
    </div>
  );
}
