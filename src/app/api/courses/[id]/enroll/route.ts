import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const userId = getDataFromToken(request);

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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student to enroll into course",
        },
        { status: 400 }
      );
    }

    const { id } = params;

    const course = await Course.findById(id);

    if (!course) {
      return Response.json(
        {
          success: false,
          message: "Course not found",
        },
        { status: 404 }
      );
    }

    await Enrollment.create({
      student: userId,
      course: id,
      status: "active",
    });

    course.enrollmentCount = course.enrollmentCount + 1;
    await course.save();

    return Response.json(
      {
        success: true,
        message: "Enrolled successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error occured while enrolling", error);
    return Response.json(
      {
        success: false,
        message: "Error occured while enrolling",
      },
      { status: 500 }
    );
  }
}
