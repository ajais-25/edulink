"use client";

import {
  Clock,
  HelpCircle,
  CheckCircle,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

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
  questions?: Question[];
  questionCount?: number;
}

interface QuizSummaryProps {
  quiz: Quiz;
  courseId: string;
  moduleId: string;
  lessonId: string;
}

export default function QuizSummary({
  quiz,
  courseId,
  moduleId,
  lessonId,
}: QuizSummaryProps) {
  const totalQuestions = quiz.questionCount || quiz.questions?.length || 0;

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-gray-900">
      {/* Quiz Details Card */}
      <div className="max-w-xl w-full bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl text-center">
        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-6 h-6 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Ready to take the quiz?
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Test your knowledge! You have {quiz.timeLimit} minutes to complete{" "}
          {totalQuestions} questions.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold text-sm">{quiz.timeLimit}m</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Time Limit
            </p>
          </div>
          <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-400 mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="font-bold text-sm">{quiz.passingScore}%</span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Passing Score
            </p>
          </div>
        </div>

        <Link
          href={`/courses/${courseId}/learn/quiz/${quiz._id}?moduleId=${moduleId}&lessonId=${lessonId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all transform hover:scale-[1.02] w-full max-w-xs mx-auto"
        >
          <PlayCircle className="w-4 h-4" />
          Start Quiz
        </Link>
      </div>
    </div>
  );
}
