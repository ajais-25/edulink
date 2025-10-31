import { getDataFromToken } from "@/helpers/getDataFromToken";
import { getQuizResult } from "@/helpers/getQuizResult";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import Quiz from "@/models/Quiz";
import QuizAttempt from "@/models/QuizAttempt";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function POST(
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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student to submit a quiz",
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

    const isEnrolled = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!isEnrolled) {
      return Response.json(
        {
          success: false,
          message: "You are not enrolled to this course",
        },
        { status: 400 }
      );
    }

    const { responses } = await request.json();

    if (!responses) {
      return Response.json(
        {
          success: false,
          message: "You cannot submit empty quiz",
        },
        { status: 400 }
      );
    }

    const { quizResult, responses: newResponses } = getQuizResult(
      responses,
      lessonQuiz.questions
    );

    const quizAttempt = await QuizAttempt.findOne({ quizId: lessonQuiz._id });

    if (!quizAttempt) {
      return Response.json(
        {
          success: false,
          message: "Error occured while submitting quiz",
        },
        { status: 500 }
      );
    }

    const { score, totalPoints, pointsEarned, passed } = quizResult;

    quizAttempt.responses = newResponses;
    quizAttempt.score = score;
    quizAttempt.totalPoints = totalPoints;
    quizAttempt.pointsEarned = pointsEarned;
    quizAttempt.passed = passed;
    quizAttempt.status = "completed";
    quizAttempt.submittedAt = new Date(Date.now());

    await quizAttempt.save();

    return Response.json(
      {
        success: true,
        message: "Quiz submitted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while submitting quiz");
    return Response.json(
      {
        success: false,
        message: "Error occured while submitting quiz",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: { courseId: string; moduleId: string; lessonId: string } }
) {
  await dbConnect();

  try {
    const searchParams = request.nextUrl.searchParams;
    const attemptId = searchParams.get("attemptId");

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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student to submit a quiz",
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

    const isEnrolled = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (!isEnrolled) {
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
