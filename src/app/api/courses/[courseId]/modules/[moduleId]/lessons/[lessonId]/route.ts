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

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: { courseId: string; moduleId: string; lessonId: string } }
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

    const { courseId, moduleId, lessonId } = params;

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

    console.log(lesson);

    return Response.json(
      {
        success: true,
        message: "Lesson found",
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

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: { courseId: string; moduleId: string; lessonId: string } }
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

    const { courseId, moduleId, lessonId } = params;

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
      const deletedLesson = await Lesson.findByIdAndDelete(lessonId);

      console.log(deletedLesson);

      await deleteFile(lessonVideo.fileId);
    } else if (lesson.type === "quiz") {
      const deletedQuiz = await Quiz.findByIdAndDelete(lesson.quizId);

      console.log(deletedQuiz);
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
