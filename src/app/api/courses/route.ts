import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const userId = getDataFromToken(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const level = searchParams.get("level");
    const sort = searchParams.get("sort");

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

    // Get the list of course IDs the user is already enrolled in
    const enrolledCourses = await Enrollment.find({ student: userId }).select(
      "course"
    );
    const enrolledCourseIds = enrolledCourses.map((e) => e.course);

    const matchStage: any = {
      isPublished: true,
      instructor: { $ne: new mongoose.Types.ObjectId(userId) },
      _id: { $nin: enrolledCourseIds },
    };

    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }

    if (level && level !== "All") {
      matchStage.level = level.toLowerCase();
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          avgRating: { $avg: "$ratings.rating" },
          numRatings: { $size: "$ratings" },
        },
      },
    ];

    if (sort) {
      switch (sort) {
        case "rated":
          pipeline.push({ $sort: { avgRating: -1 } });
          break;
        case "reviewed":
          pipeline.push({ $sort: { numRatings: -1 } });
          break;
        case "newest":
          pipeline.push({ $sort: { createdAt: -1 } });
          break;
        default:
          pipeline.push({ $sort: { createdAt: 1 } });
      }
    } else {
      pipeline.push({ $sort: { createdAt: 1 } });
    }

    const courses = await Course.aggregate(pipeline);

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
          message: "You need to be an Instructor to create a course",
        },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      category,
      level,
      price,
      learnings,
      isPublished,
      imagekit,
    } = await request.json();

    if (
      !title ||
      !description ||
      !category ||
      !level ||
      !price ||
      !learnings ||
      isPublished === undefined
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

    if (!imagekit || !imagekit.url) {
      return Response.json(
        {
          success: false,
          message: "Invalid file upload data",
        },
        { status: 400 }
      );
    }

    const course = await Course.create({
      title,
      description,
      instructor: userId,
      thumbnail: {
        fileId: imagekit.fileId,
        url: imagekit.url,
      },
      category,
      level,
      price,
      learnings,
      isPublished,
    });

    return Response.json(
      {
        success: true,
        message: "Course created successfully",
        data: course,
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
