import mongoose, { Schema, Document, Types } from "mongoose";

export interface Content {
  videoUrl?: string;
  duration?: number;
  quizId?: Types.ObjectId;
}

export interface Lesson extends Document {
  title: string;
  description: string;
  order: number;
  type: "video" | "quiz";
  content: Content;
}

const lessonSchema: Schema<Lesson> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "quiz"],
      required: true,
    },
    content: {
      videoUrl: String,
      duration: Number,
      quizId: {
        type: Schema.Types.ObjectId,
        ref: "Quiz",
      },
    },
  },
  { timestamps: true }
);

const Lesson =
  (mongoose.models.Lesson as mongoose.Model<Lesson>) ||
  mongoose.model<Lesson>("Lesson", lessonSchema);

export default Lesson;
