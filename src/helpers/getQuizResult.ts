import { Question } from "@/models/Quiz";
import { Response } from "@/models/QuizAttempt";

interface UserResponse {
  questionId: number;
  selectedOption: number;
}

export function getQuizResult(
  userResponses: UserResponse[],
  answers: Question[],
  passingScore: number
) {
  let totalPoints: number = 0;
  let score: number = 0;

  for (const answer of answers) {
    totalPoints += answer.points;
  }

  let evaluatedResponses: Response[] = [];
  for (const userResponse of userResponses) {
    const answer = answers.find(
      (a) => a.questionNo === userResponse.questionId
    );

    if (answer && userResponse.selectedOption === answer.correctOption) {
      score += answer.points;
    }

    evaluatedResponses.push({
      questionId: userResponse.questionId,
      selectedOption: userResponse.selectedOption,
      correctOption: answer ? answer.correctOption : -1,
      isCorrect: answer
        ? userResponse.selectedOption === answer.correctOption
        : false,
      points: answer ? answer.points : 0,
      explanation: answer ? answer.explanation : "",
    });
  }

  let passed: boolean = false;
  if (score >= passingScore) {
    passed = true;
  }

  return {
    score,
    totalPoints,
    passed,
    evaluatedResponses,
  };
}
