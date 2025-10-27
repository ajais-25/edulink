import mongoose, { Schema, Document, Types } from "mongoose";

export interface Option {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  questionNo: number;
  question: string;
  options: Option[];
  points: number;
  explanation: string;
}

export interface Quiz extends Document {
  lessonId: Types.ObjectId;
  timeLimit: number;
  passingScore: number;
  questions: Question[];
}

const questionSchema: Schema<Question> = new Schema({
  questionNo: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],
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
});

const quizSchema: Schema<Quiz> = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    timeLimit: {
      type: Number,
      required: true,
    },
    passingScore: {
      type: Number,
      required: true,
    },
    questions: {
      type: [questionSchema],
      required: true,
    },
  },
  { timestamps: true }
);

const Quiz =
  (mongoose.models.Quiz as mongoose.Model<Quiz>) ||
  mongoose.model<Quiz>("Quiz", quizSchema);

export default Quiz;
