import { RotateCcw } from "lucide-react";

interface QuizAttemptsListProps {
  attempts: any[];
  isLoading: boolean;
}

export default function QuizAttemptsList({
  attempts,
  isLoading,
}: QuizAttemptsListProps) {
  if (!attempts.length && !isLoading) return null;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-gray-400" />
          Previous Attempts
        </h3>
      </div>
      <div className="p-2 space-y-2 relative">
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
        {!isLoading &&
          attempts.map((attempt, index) => (
            <div
              key={attempt._id || index}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono text-xs w-6">
                  #{attempts.length - index}
                </span>
                <div>
                  <div
                    className={`font-semibold text-sm ${
                      attempt.passed ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(attempt.startedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {attempt.score}/{attempt.totalPoints}
                </div>
                <div className="text-[10px] text-gray-500">Score</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
