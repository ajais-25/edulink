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

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
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

    const { courseId, moduleId } = params;

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

    const moduleLessons = await Lesson.find({ moduleId }).sort({ order: 1 });

    return Response.json(
      {
        success: true,
        message: "Module lessons fetched successfully",
        data: moduleLessons,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while fetching lessons");
    return Response.json(
      {
        success: false,
        message: "Error occured while fetching lessons",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
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
          message: "You need to be an Instructor to create a lesson",
        },
        { status: 400 }
      );
    }

    const { courseId, moduleId } = params;

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
        { status: 401 }
      );
    }

    const { title, description, order, type } = await request.json();

    if (!title || !description || !order || !type) {
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

      courseLesson = await Lesson.create({
        title,
        description,
        order,
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
        videoUrl: imagekit.url,
        thumbnail: `${imagekit.url}/ik-thumbnail.jpg?tr=so-0`,
        duration: imagekit.duration,
      });

      courseLesson.videoId = video._id as Types.ObjectId;
      await courseLesson.save();
    } else if (type === "quiz") {
      courseLesson = await Lesson.create({
        title,
        description,
        order,
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

      const {
        title: quizTitle,
        timeLimit,
        passingScore,
        questions,
        isPublished,
      } = await request.json();

      if (
        !quizTitle ||
        !timeLimit ||
        !passingScore ||
        !questions ||
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

      const lessonQuiz = await Quiz.create({
        lessonId: courseLesson._id,
        title: quizTitle,
        timeLimit,
        passingScore,
        questions,
        isPublished,
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
