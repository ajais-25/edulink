"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

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
  timeLimit: number; // in minutes
  passingScore: number;
  questions: Question[];
}

interface QuizInterfaceProps {
  quiz: Quiz;
  courseId: string;
  moduleId: string;
  lessonId: string;
  attemptId: string;
  onComplete?: (score: number, totalPoints: number) => void;
  onExit?: () => void;
}

export default function QuizInterface({
  quiz,
  courseId,
  moduleId,
  lessonId,
  attemptId,
  onComplete,
  onExit,
}: QuizInterfaceProps) {
  const storageKey = `quiz_attempt_${attemptId}`;

  const getInitialState = () => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.quizId === quiz._id && parsed.attemptId === attemptId) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error loading saved quiz state:", e);
    }
    return null;
  };

  const savedState = getInitialState();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    savedState?.currentQuestionIndex ?? 0
  );
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >(savedState?.selectedAnswers ?? {});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    savedState?.timeRemaining ?? quiz.timeLimit * 60
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const hasSubmittedRef = useRef(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  useEffect(() => {
    if (showResults || hasSubmittedRef.current) return;

    const stateToSave = {
      quizId: quiz._id,
      attemptId,
      currentQuestionIndex,
      selectedAnswers,
      timeRemaining,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Error saving quiz state:", e);
    }
  }, [
    currentQuestionIndex,
    selectedAnswers,
    timeRemaining,
    showResults,
    quiz._id,
    attemptId,
    storageKey,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!showResults && !hasSubmittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showResults]);

  const clearSavedState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Error clearing saved quiz state:", e);
    }
  }, [storageKey]);

  const submitQuiz = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    setIsSubmitting(true);

    try {
      const responses = quiz.questions.map((question, index) => ({
        questionId: question.questionNo,
        selectedOption: selectedAnswers[index] ?? -1,
      }));

      const res = await api.post(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz-result?attemptId=${attemptId}`,
        { responses }
      );

      if (res.data.success) {
        clearSavedState();
        setShowResults(true);
        if (onComplete) {
          const data = res.data.data;
          onComplete(data.score, data.totalPoints);
        }
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error(error.response?.data?.message || "Failed to submit quiz");
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    quiz.questions,
    selectedAnswers,
    courseId,
    moduleId,
    lessonId,
    onComplete,
    clearSavedState,
  ]);

  useEffect(() => {
    if (showResults || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResults, isSubmitting]);

  useEffect(() => {
    if (isTimerExpired && !hasSubmittedRef.current) {
      submitQuiz();
    }
  }, [isTimerExpired, submitQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeRemaining <= 60)
      return "text-red-500 bg-red-500/10 border-red-500/20";
    if (timeRemaining <= 300)
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-gray-300 bg-gray-800 border-gray-700";
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitting || isTimerExpired) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmitWithConfirmation();
    } else {
      setCurrentQuestionIndex((prev: number) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev: number) => Math.max(0, prev - 1));
  };

  const handleSubmitWithConfirmation = () => {
    const unanswered =
      quiz.questions.length - Object.keys(selectedAnswers).length;
    const message =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Are you sure you want to submit?`
        : "Are you sure you want to submit the quiz?";
    if (window.confirm(message)) {
      submitQuiz();
    }
  };

  if (isSubmitting) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center p-6 bg-gray-900 text-white">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-xl">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Submitting Quiz...
          </h2>
          <p className="text-gray-400">
            Please wait while we process your answers.
          </p>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-gray-900 text-white">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">
            Quiz Completed!
          </h2>
          <p className="text-gray-400">Your answers have been recorded.</p>
          {onExit && (
            <button
              onClick={onExit}
              className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors cursor-pointer"
            >
              Exit Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-900 text-white">
      <div className="w-full max-w-4xl mx-auto p-4 lg:p-8 flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">
              Question {currentQuestionIndex + 1}
            </h2>
            <p className="text-sm text-gray-400">of {totalQuestions}</p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${getTimerColor()}`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
            {onExit && (
              <button
                onClick={handleSubmitWithConfirmation}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-md"
              >
                Submit
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 h-2 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Question Card */}
        <div className="flex-1 overflow-y-auto mb-8">
          <h3 className="text-xl lg:text-3xl font-medium text-white mb-8 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {currentQuestion.options.map((option, index) => {
              const isSelected =
                selectedAnswers[currentQuestionIndex] === index;
              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isTimerExpired}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800 hover:border-gray-600 hover:bg-gray-750"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-500 group-hover:border-gray-400"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-base lg:text-lg ${
                      isSelected ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-auto pt-6 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={
              selectedAnswers[currentQuestionIndex] === undefined ||
              isTimerExpired
            }
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLastQuestion ? "Finish Quiz" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
