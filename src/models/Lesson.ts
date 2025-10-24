import mongoose, { Schema, Document, Types } from "mongoose";

export interface Lesson extends Document {
  moduleId: Types.ObjectId;
  title: string;
  order: number;
  type: "video" | "quiz";
  videoId: Types.ObjectId;
  quizId: Types.ObjectId;
}

const lessonSchema: Schema<Lesson> = new Schema(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
    },
    title: {
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
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
    },
  },
  { timestamps: true }
);

const Lesson =
  (mongoose.models.Lesson as mongoose.Model<Lesson>) ||
  mongoose.model<Lesson>("Lesson", lessonSchema);

export default Lesson;
