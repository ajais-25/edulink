import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Module from "@/models/Module";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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

    const courseModules = await Module.find({ courseId })
      .populate("lessons")
      .sort({
        order: 1,
      });

    return Response.json(
      {
        success: true,
        message: "Course modules fetched successfully",
        data: courseModules,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching module");
    return Response.json(
      {
        success: false,
        message: "Error fetching module",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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
        { status: 401 }
      );
    }

    const { title, description, order } = await request.json();

    if (!title || !description || !order) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

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

    await Module.create({
      courseId,
      title,
      description,
      order,
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
