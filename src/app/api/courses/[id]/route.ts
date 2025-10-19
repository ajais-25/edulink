import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(
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

    return Response.json(
      {
        success: true,
        message: "Course fetched successfully",
        data: course,
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

    if (user.role !== "instructor") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Instructor to update a course",
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

    const {
      title,
      description,
      category,
      level,
      price,
      isPublished,
      imagekit,
      userId: bodyUserId,
    } = await request.json();

    if (
      !title ||
      !description ||
      !category ||
      !level ||
      !price ||
      !isPublished
    ) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    if (
      level !== "beginner" ||
      level !== "intermediate" ||
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

    if (bodyUserId !== userId) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized user",
        },
        { status: 401 }
      );
    }

    if (!imagekit || !imagekit.url) {
      return Response.json(
        {
          success: false,
          message: "Invalid file upload data",
        },
        { status: 400 }
      );
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      {
        title,
        description,
        instructor: userId,
        thumbnail: imagekit.url,
        category,
        level,
        price,
        isPublished,
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
