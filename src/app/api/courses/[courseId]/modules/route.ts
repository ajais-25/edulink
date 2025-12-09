import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Module from "@/models/Module";
import User from "@/models/User";
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

    if (user.role !== "instructor") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Instructor to create a module",
        },
        { status: 403 }
      );
    }

    const { courseId } = params;

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

    if (course.instructor.toString() !== userId) {
      return Response.json(
        {
          success: false,
          message: "You are not the instructor of this course",
        },
        { status: 403 }
      );
    }

    const { title } = await request.json();

    if (!title) {
      return Response.json(
        {
          success: false,
          message: "Title is required",
        },
        { status: 400 }
      );
    }

    await Module.create({
      courseId,
      title,
    });

    return Response.json(
      {
        success: true,
        message: "Module created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating module");
    return Response.json(
      {
        success: false,
        message: "Error creating module",
      },
      { status: 500 }
    );
  }
}
