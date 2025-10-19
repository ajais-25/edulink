import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import User from "@/models/User";
import { NextRequest } from "next/server";

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
          message: "You need to be an Instructor to change publish status",
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

    course.isPublished = !course.isPublished;
    await course.save();

    return Response.json(
      {
        success: true,
        message: "Course status changed successfully",
        data: course,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing status", error);
    return Response.json(
      {
        success: false,
        message: "Error changing status",
      },
      { status: 500 }
    );
  }
}
