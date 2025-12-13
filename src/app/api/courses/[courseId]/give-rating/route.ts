import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  await dbConnect();

  try {
    const userId = getDataFromToken(request);

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized - Invalid or expired token",
        },
        { status: 401 }
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized user",
        },
        { status: 401 }
      );
    }

    const { courseId } = params;

    const { rating } = await request.json();

    const course = await Course.findById(courseId);

    if (!course) {
      return Response.json(
        {
          success: false,
          message: "Course not found",
        },
        { status: 404 }
      );
    }

    const isEnrolled = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!isEnrolled) {
      return Response.json(
        {
          success: false,
          message: "You are not enrolled in this course",
        },
        { status: 403 }
      );
    }

    const existingRatingIndex = course.ratings.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      course.ratings[existingRatingIndex].rating = rating;
      await course.save();

      return Response.json(
        {
          success: true,
          message: "Rating updated successfully",
        },
        { status: 200 }
      );
    }

    course.ratings.push({
      userId: new mongoose.Types.ObjectId(userId),
      rating,
    });
    await course.save();

    return Response.json(
      {
        success: true,
        message: "Rating added successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding rating", error);
    return Response.json(
      {
        success: false,
        message: "Error adding rating",
      },
      { status: 500 }
    );
  }
}
