import mongoose, { Schema, Document, Types } from "mongoose";

export interface CompletedLesson {
  moduleId: Types.ObjectId;
  lessonId: Types.ObjectId;
  completedAt?: Date;
  score?: number; // for quizzes
}

export interface Progress {
  completedLessons: CompletedLesson[];
  overallProgress: number;
  lastAccessed: Date;
}

export interface Enrollment extends Document {
  // check
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: "active" | "completed";
  progress: Progress;
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
    progress: {
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
          completedAt: Date,
          score: {
            // for quizzes
            type: Number,
            default: 0,
          },
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
  },
  { timestamps: true }
);

const Enrollment =
  (mongoose.models.Enrollment as mongoose.Model<Enrollment>) ||
  mongoose.model<Enrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
