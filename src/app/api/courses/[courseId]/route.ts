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

    const modules = await Module.find({ courseId })
      .sort({ createdAt: 1 })
      .lean();

    const modulesWithLessons = await Module.aggregate([
      {
        $match: {
          _id: { $in: modules.map((m) => m._id) },
        },
      },
      {
        $lookup: {
          from: "lessons",
          localField: "_id",
          foreignField: "moduleId",
          as: "lessons",
        },
      },
    ]);

    return Response.json(
      {
        success: true,
        message: "Course fetched successfully",
        data: { course, modules: modulesWithLessons },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching course", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching course",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (user.role !== "instructor") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Instructor to update a course",
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

    const { title, description, category, level, price } = await request.json();

    if (!title || !description || !category || !level || !price) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (
      level !== "beginner" &&
      level !== "intermediate" &&
      level !== "advanced"
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid level provided",
        },
        { status: 400 }
      );
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title,
        description,
        instructor: userId,
        category,
        level,
        price,
      },
      { new: true }
    );

    return Response.json(
      {
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("An error occured while creating course", error);
    return Response.json(
      {
        success: false,
        message: "An error occured while creating course",
      },
      { status: 500 }
    );
  }
}
