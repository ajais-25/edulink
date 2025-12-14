"use client";

import { useState } from "react";
import { Clock, HelpCircle } from "lucide-react";

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
  onComplete?: (score: number, totalPoints: number) => void;
  onExit?: () => void;
}

export default function QuizInterface({
  quiz,
  onComplete,
  onExit,
}: QuizInterfaceProps) {
  // Removed 'started' state as this component assumes it's being used in a dedicated view
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    setShowResults(true);
    // Calculate score logic can be added here
    if (onComplete) {
      // Mock calculation or callback
      onComplete(0, 0);
    }
  };

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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700 text-sm text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{quiz.timeLimit}:00</span>
            </div>
            {onExit && (
              <button
                onClick={onExit}
                className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 text-sm transition-colors cursor-pointer"
              >
                Exit
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
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 cursor-pointer group ${
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
            disabled={selectedAnswers[currentQuestionIndex] === undefined} // Optional: require answer to proceed
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLastQuestion ? "Finish Quiz" : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
