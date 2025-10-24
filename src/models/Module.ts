import mongoose, { Schema, Document, Types } from "mongoose";

export interface Module extends Document {
  courseId: Types.ObjectId;
  title: string;
  description: string;
  order: number;
}

const moduleSchema: Schema<Module> = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
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
  },
  { timestamps: true }
);

const Module =
  (mongoose.models.Module as mongoose.Model<Module>) ||
  mongoose.model<Module>("Module", moduleSchema);

export default Module;
