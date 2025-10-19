import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    const courses = await Course.find();

    return Response.json(
      {
        success: true,
        message: "Courses fetched successfully",
        data: courses,
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

export async function POST(request: NextRequest) {
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

    await Course.create({
      title,
      description,
      instructor: userId,
      thumbnail: imagekit.url,
      category,
      level,
      price,
      isPublished,
    });

    return Response.json(
      {
        success: true,
        message: "Course created successfully",
      },
      { status: 201 }
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
