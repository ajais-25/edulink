import mongoose, { Schema, Document, Types } from "mongoose";

export interface VideoProgress {
  watchedDuration?: number;
  totalDuration?: number;
  lastWatchedPosition?: number;
}

export interface CompletedLesson {
  moduleId: Types.ObjectId;
  lessonId: Types.ObjectId;
  lessonType: "video" | "quiz";
  videoProgress?: VideoProgress;
  completedAt?: Date;
}

export interface Enrollment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: "active" | "completed";
  completedLessons: CompletedLesson[];
  overallProgress: number;
  lastAccessed: Date;
}

const enrollmentSchema: Schema<Enrollment> = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    completedLessons: [
      {
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
        lessonType: {
          type: String,
          enum: ["video", "quiz"],
        },
        videoProgress: {
          watchedDuration: Number, // uniques seconds watched
          totalDuration: Number,
          lastWatchedPosition: Number, // last watch position of user
        },
        completedAt: Date,
      },
    ],
    overallProgress: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
      max: 100,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Enrollment =
  (mongoose.models.Enrollment as mongoose.Model<Enrollment>) ||
  mongoose.model<Enrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
