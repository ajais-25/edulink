import mongoose, { Schema, Document, Types } from "mongoose";

export interface Response {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  points: number;
}

export interface QuizAttempt extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  moduleId: Types.ObjectId;
  lessonId: Types.ObjectId;
  attemptNumber: number;
  responses: Response[];
  score: number;
  totalPoints: number;
  pointsEarned: number;
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
    course: {
      type: Schema.Types.ObjectId,
      ref: "Couse",
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: true,
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
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
        isCorrect: {
          type: Boolean,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    pointsEarned: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
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
  mongoose.model<QuizAttempt>("Quiz", quizAttemptSchema);

export default QuizAttempt;
