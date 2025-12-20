import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      courseId: string;
      moduleId: string;
      lessonId: string;
      attemptId: string;
    }>;
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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student for this",
        },
        { status: 403 }
      );
    }

    const { courseId, moduleId, lessonId, attemptId } = await params;

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

    const lessonQuiz = await Quiz.findById(lesson.quizId);

    if (!lessonQuiz) {
      return Response.json(
        {
          success: false,
          message: "Quiz not found",
        },
        { status: 404 }
      );
    }

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!enrollment) {
      return Response.json(
        {
          success: false,
          message: "You are not enrolled to this course",
        },
        { status: 400 }
      );
    }

    const quizAttempt = await QuizAttempt.findById(attemptId);

    if (!quizAttempt || quizAttempt.student.toString() !== userId) {
      return Response.json(
        {
          success: false,
          message: "Invalid attempt id",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Quiz attempt found",
        data: quizAttempt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting quiz result");
    return Response.json(
      {
        success: false,
        message: "Error getting quiz result",
      },
      { status: 500 }
    );
  }
}
