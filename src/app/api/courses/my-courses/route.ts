import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    let userCourses;
    if (user.role === "student") {
      userCourses = await Enrollment.find({
        student: userId,
      })
        .populate("course")
        .sort({ createdAt: -1 });
    } else if (user.role === "instructor") {
      userCourses = await Course.find({
        instructor: userId,
      }).sort({ createdAt: -1 });
    } else {
      return Response.json(
        {
          success: false,
          message: "Invalid user role",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Courses fetched successfully",
        data: userCourses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching courses", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching courses",
      },
      { status: 500 }
    );
  }
}
