import mongoose, { Schema, Document, Types } from "mongoose";

export interface Response {
  questionId: number;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  points: number;
  explanation: string;
}

export interface QuizAttempt extends Document {
  student: Types.ObjectId;
  quizId: Types.ObjectId;
  responses: Response[];
  score: number;
  totalPoints: number;
  passed: boolean;
  status: "in_progress" | "completed";
  startedAt: Date;
  submittedAt?: Date;
}

const quizAttemptSchema: Schema<QuizAttempt> = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    responses: [
      {
        questionId: {
          type: Number,
          required: true,
        },
        selectedOption: {
          type: Number,
          required: true,
        },
        correctOption: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        explanation: {
          type: String,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
    },
    passed: {
      type: Boolean,
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submittedAt: Date,
  },
  { timestamps: true }
);

const QuizAttempt =
  (mongoose.models.QuizAttempt as mongoose.Model<QuizAttempt>) ||
  mongoose.model<QuizAttempt>("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
