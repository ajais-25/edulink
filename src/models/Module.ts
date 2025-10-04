import mongoose, { Schema, Document } from "mongoose";
import { Lesson } from "./Lesson";

export interface Module extends Document {
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

const moduleSchema: Schema<Module> = new Schema(
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
    lessons: [
      {
        type: Schema.Types.ObjectId,
        required: true,
      },
    ],
  },
  { timestamps: true }
);

const Module =
  (mongoose.models.Module as mongoose.Model<Module>) ||
  mongoose.model<Module>("Module", moduleSchema);

export default Module;
