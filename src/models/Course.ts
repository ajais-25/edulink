import mongoose, { Schema, Document, Types } from "mongoose";

export interface Rating {
  userId: Types.ObjectId;
  rating: number;
}

export interface Thumbnail {
  fileId: string;
  url: string;
}

export interface Course extends Document {
  title: string;
  description: string;
  instructor: Types.ObjectId;
  thumbnail: Thumbnail;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  ratings: Rating[];
}

const courseSchema: Schema<Course> = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnail: {
      fileId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    category: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      required: true,
      default: 0,
    },
    ratings: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const Course =
  (mongoose.models.Course as mongoose.Model<Course>) ||
  mongoose.model<Course>("Course", courseSchema);

export default Course;
