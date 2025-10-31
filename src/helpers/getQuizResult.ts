import { Question } from "@/models/Quiz";
import { Response } from "@/models/QuizAttempt";

export function getQuizResult(responses: Response[], answers: Question[]) {
  console.log("Response: ", responses);
  console.log("Answers: ", answers);

  let totalPoints: number = 0;
  let pointsEarned: number = 0;
  for (let i = 0; i < answers.length; i++) {
    totalPoints += answers[i].points;

    if (responses[i].selectedOption === answers[i].correctOption) {
      pointsEarned += answers[i].points;
      responses[i].isCorrect = true;
      responses[i].points = answers[i].points;
    } else {
      responses[i].isCorrect = false;
      responses[i].points = 0;
    }
    responses[i].explanation = answers[i].explanation;
  }

  const score = Math.round((pointsEarned / totalPoints) * 100);

  let passed: boolean = false;
  if (score >= 70) {
    passed = true;
  }

  const quizResult = {
    score,
    totalPoints,
    pointsEarned,
    passed,
  };

  return { quizResult, responses };
}
