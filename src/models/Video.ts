import mongoose, { Schema, Document, Types } from "mongoose";

export interface Video extends Document {
  lessonId: Types.ObjectId;
  fileId: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
}

const videoSchema: Schema<Video> = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    fileId: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Video =
  (mongoose.models.video as mongoose.Model<Video>) ||
  mongoose.model<Video>("Video", videoSchema);

export default Video;
