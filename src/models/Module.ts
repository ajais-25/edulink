import { deleteFile } from "@/helpers/deleteFile";
import mongoose, { Schema, Document, Types } from "mongoose";

export interface Module extends Document {
  courseId: Types.ObjectId;
  title: string;
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
  },
  { timestamps: true }
);

// Cascade delete: Delete all lessons when module is deleted
moduleSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const lessons = await mongoose
        .model("Lesson")
        .find({ moduleId: this._id });

      for (const lesson of lessons) {
        if (lesson.type === "quiz") {
          await mongoose.model("Quiz").deleteMany({ lessonId: lesson._id });
        } else {
          const lessonVideo = await mongoose
            .model("Video")
            .findOne({ lessonId: lesson._id });

          if (lessonVideo) {
            await mongoose.model("Video").deleteMany({ lessonId: lesson._id });
            await deleteFile(lessonVideo.fileId);
          }
        }
      }

      await mongoose.model("Lesson").deleteMany({ moduleId: this._id });
      next();
    } catch (error: any) {
      next(error);
    }
  }
);

const Module =
  (mongoose.models.Module as mongoose.Model<Module>) ||
  mongoose.model<Module>("Module", moduleSchema);

export default Module;
