import mongoose, { Schema, Document, Types } from "mongoose";

export interface VideoProgress extends Document {
  courseId: Types.ObjectId;
  moduleId: Types.ObjectId;
  lessonId: Types.ObjectId;
  studentId: Types.ObjectId;
  watchedDuration: number;
  totalDuration: number;
  lastWatchedPosition: number;
  isCompleted: boolean;
}

const videoProgressSchema: Schema<VideoProgress> = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
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
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    watchedDuration: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDuration: {
      type: Number,
      required: true,
      default: 0,
    },
    lastWatchedPosition: {
      type: Number,
      required: true,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const VideoProgress =
  (mongoose.models.VideoProgress as mongoose.Model<VideoProgress>) ||
  mongoose.model<VideoProgress>("VideoProgress", videoProgressSchema);

export default VideoProgress;
