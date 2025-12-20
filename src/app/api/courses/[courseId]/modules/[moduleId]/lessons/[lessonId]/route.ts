import { getDataFromToken } from "@/helpers/getDataFromToken";
import { deleteFile } from "@/helpers/deleteFile";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import Video from "@/models/Video";
import { NextRequest } from "next/server";
import QuizAttempt from "@/models/QuizAttempt";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  }
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

    const { courseId, moduleId, lessonId } = await params;

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

    const lesson = await Lesson.findById(lessonId).populate("videoId quizId");

    if (!lesson) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found",
        },
        { status: 404 }
      );
    }

    let quizAttempts;
    if (lesson.type === "quiz") {
      quizAttempts = await QuizAttempt.find({ quizId: lesson.quizId }).sort({
        createdAt: -1,
      });
    }

    return Response.json(
      {
        success: true,
        message: "Lesson found",
        data: { lesson, quizAttempts },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while fetching lesson");
    return Response.json(
      {
        success: false,
        message: "Error occured while fetching lesson",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  }
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
          message: "You need to be an Instructor to update a lesson",
        },
        { status: 403 }
      );
    }

    const { courseId, moduleId, lessonId } = await params;

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

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found",
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

    lesson.title = title;
    await lesson.save();

    return Response.json(
      {
        success: true,
        message: "Lesson title updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while updating lesson");
    return Response.json(
      {
        success: false,
        message: "Error occured while updating lesson",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
  }
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
          message: "You need to be an Instructor to delete a lesson",
        },
        { status: 403 }
      );
    }

    const { courseId, moduleId, lessonId } = await params;

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

    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found",
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

    if (lesson.type === "video") {
      const lessonVideo = await Video.findById(lesson.videoId);

      if (!lessonVideo) {
        return Response.json(
          {
            success: false,
            message: "Lesson not found",
          },
          { status: 404 }
        );
      }

      await Video.findByIdAndDelete(lesson.videoId);
      await Lesson.findByIdAndDelete(lessonId);

      await deleteFile(lessonVideo.fileId);
    } else if (lesson.type === "quiz") {
      await Quiz.findByIdAndDelete(lesson.quizId);
    }

    return Response.json(
      {
        success: true,
        message: "Lesson deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while deleting lesson");
    return Response.json(
      {
        success: false,
        message: "Error occured while deleting lesson",
      },
      { status: 500 }
    );
  }
}
