import { getDataFromToken } from "@/helpers/getDataFromToken";
import { deleteFile } from "@/helpers/imagekit/deleteFile";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import User from "@/models/User";
import { NextRequest } from "next/server";

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
          message: "You need to be an Instructor to change thumbnail",
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

    const { imagekit } = await request.json();

    if (!imagekit || !imagekit.url) {
      return Response.json(
        {
          success: false,
          message: "Invalid file upload data",
        },
        { status: 400 }
      );
    }

    await deleteFile(course.thumbnail.fileId);

    course.thumbnail.fileId = imagekit.fileId;
    course.thumbnail.url = imagekit.url;
    await course.save();

    return Response.json(
      {
        success: true,
        message: "Course thumbnail changed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing thumbnail", error);
    return Response.json(
      {
        success: false,
        message: "Error changing thumbnail",
      },
      { status: 500 }
    );
  }
}
