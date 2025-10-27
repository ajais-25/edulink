import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
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

    const { courseId, moduleId } = params;

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

    const courseModule = await Module.findById(moduleId);

    if (!courseModule) {
      return Response.json(
        {
          success: false,
          message: "Module not found",
        },
        { status: 404 }
      );
    }

    const lessons = await Lesson.find({ moduleId })
      .select("title type")
      .sort({ createdAt: 1 });

    return Response.json(
      {
        success: true,
        message: "Module found",
        data: { module: courseModule, lessons },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while fetching module");
    return Response.json(
      {
        success: false,
        message: "Error occured while fetching module",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
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

    if (user.role !== "instructor") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Instructor to update a module",
        },
        { status: 403 }
      );
    }

    const { courseId, moduleId } = params;

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

    const courseModule = await Module.findById(moduleId);

    if (!courseModule) {
      return Response.json(
        {
          success: false,
          message: "Module not found",
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

    if (courseModule.courseId.toString() !== courseId) {
      return Response.json(
        {
          success: false,
          message: "Module does not belong to this course",
        },
        { status: 400 }
      );
    }

    const { title } = await request.json();

    if (!title) {
      return Response.json(
        {
          success: false,
          message: "Title is not required",
        },
        { status: 400 }
      );
    }

    courseModule.title = title;
    await courseModule.save();

    return Response.json(
      {
        success: true,
        message: "Module updated successfully",
        data: courseModule,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while updating module");
    return Response.json(
      {
        success: false,
        message: "Error occured while updating module",
      },
      { status: 500 }
    );
  }
}
