import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
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

    return Response.json(
      {
        success: true,
        message: "Module found",
        data: courseModule,
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
        { status: 401 }
      );
    }

    const { title, description, order } = await request.json();

    const isExistingOrder = await Module.findOne({ courseId, order });

    if (isExistingOrder) {
      return Response.json(
        {
          success: false,
          message: "Incorrect module order",
        },
        { status: 400 }
      );
    }

    courseModule.title = title;
    courseModule.description = description;
    courseModule.order = order;

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
