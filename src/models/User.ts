import mongoose, { Schema, Document, Types } from "mongoose";

export interface SocialLinks {
  linkedIn?: string;
  twitter?: string;
}

export interface Profile {
  bio?: string;
  avatar?: string;
  socialLinks?: SocialLinks;
}

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  role: "student" | "instructor";
  profile: Profile;
  verifyCode: string;
  verifyCodeExpiry: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  courses: Types.ObjectId[];
}

const userSchema: Schema<User> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please use a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "instructor"],
      default: "student",
    },
    profile: {
      bio: String,
      avatar: String,
      socialLinks: {
        linkedIn: String,
        twitter: String,
      },
    },
    verifyCode: String,
    verifyCodeExpiry: Date,
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  { timestamps: true }
);

const User =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", userSchema);

export default User;
