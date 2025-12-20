import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import Video from "@/models/Video";
import { Types } from "mongoose";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
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
          message: "You need to be an Instructor to create a lesson",
        },
        { status: 403 }
      );
    }

    const { courseId, moduleId } = await params;

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

    if (course.instructor.toString() !== userId) {
      return Response.json(
        {
          success: false,
          message: "You are not the instructor of this course",
        },
        { status: 403 }
      );
    }

    const { title, type, imagekit, timeLimit, passingScore, questions } =
      await request.json();

    if (!title || !type) {
      return Response.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    let courseLesson;
    if (type === "video") {
      if (!imagekit || !imagekit.url) {
        return Response.json(
          {
            success: false,
            message: "Invalid file upload data",
          },
          { status: 400 }
        );
      }

      courseLesson = await Lesson.create({
        moduleId,
        title,
        type,
      });

      if (!courseLesson) {
        return Response.json(
          {
            success: false,
            message: "Error creating course lesson",
          },
          { status: 500 }
        );
      }

      const video = await Video.create({
        lessonId: courseLesson._id,
        fileId: imagekit.fileId,
        videoUrl: imagekit.url,
        thumbnail: `${imagekit.url}/ik-thumbnail.jpg?tr=so-0`,
        duration: imagekit.duration,
      });

      courseLesson.videoId = video._id as Types.ObjectId;
      await courseLesson.save();
    } else if (type === "quiz") {
      courseLesson = await Lesson.create({
        moduleId,
        title,
        type,
      });

      if (!courseLesson) {
        return Response.json(
          {
            success: false,
            message: "Error creating course lesson",
          },
          { status: 500 }
        );
      }

      if (!timeLimit || !passingScore || !questions) {
        return Response.json(
          {
            success: false,
            message: "All fields are required",
          },
          { status: 400 }
        );
      }

      const lessonQuiz = await Quiz.create({
        lessonId: courseLesson._id,
        timeLimit,
        passingScore,
        questions,
      });

      console.log(lessonQuiz);

      if (!lessonQuiz) {
        return Response.json(
          {
            success: false,
            message: "Error creating quiz",
          },
          { status: 500 }
        );
      }

      courseLesson.quizId = lessonQuiz._id as Types.ObjectId;
      await courseLesson.save();
    } else {
      return Response.json(
        {
          success: false,
          message: "Invalid lesson type",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Lesson created successfully",
        data: courseLesson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error occured while creating lesson");
    return Response.json(
      {
        success: false,
        message: "Error occured while creating lesson",
      },
      { status: 500 }
    );
  }
}
