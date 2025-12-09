import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: { courseId: string; moduleId: string; lessonId: string } }
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

    if (course.instructor.toString() !== userId) {
      return Response.json(
        {
          success: false,
          message: "You are not the instructor of this course",
        },
        { status: 403 }
      );
    }

    const { timeLimit, passingScore, questions } = await request.json();

    if (!timeLimit || !passingScore || !questions) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const lessonQuiz = await Quiz.findById(lesson.quizId);

    if (!lessonQuiz) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found",
        },
        { status: 404 }
      );
    }

    lessonQuiz.timeLimit = timeLimit;
    lessonQuiz.passingScore = passingScore;
    lessonQuiz.questions = questions;

    await lessonQuiz.save();

    return Response.json(
      {
        success: true,
        message: "Quiz updated successfully",
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
