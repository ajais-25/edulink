import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import User from "@/models/User";
import Video from "@/models/Video";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

// video progress tracking
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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student for this",
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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You must be Student",
        },
        { status: 403 }
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
          message: "You are not enrolled in this course",
        },
        { status: 400 }
      );
    }

    const lessonVideo = await Video.findById(lesson.videoId);

    if (!lessonVideo) {
      return Response.json(
        {
          success: false,
          message: "Video not found",
        },
        { status: 404 }
      );
    }

    const { watchedDuration, lastWatchedPosition, totalDuration } =
      await request.json();

    if (
      typeof watchedDuration !== "number" ||
      typeof totalDuration !== "number" ||
      typeof lastWatchedPosition !== "number"
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid input data",
        },
        { status: 400 }
      );
    }

    if (watchedDuration < 0 || lastWatchedPosition < 0 || totalDuration <= 0) {
      return Response.json(
        {
          success: false,
          message: "Invalid duration values",
        },
        { status: 400 }
      );
    }

    // 10% buffer
    if (totalDuration > lessonVideo.duration * 1.1) {
      return Response.json(
        {
          success: false,
          message: "Invalid total duration",
        },
        { status: 400 }
      );
    }

    // 10% buffer
    if (watchedDuration > lessonVideo.duration * 1.1) {
      return Response.json(
        {
          success: false,
          message: "Invalid watched duration",
        },
        { status: 400 }
      );
    }

    const shouldMarkComplete = watchedDuration === totalDuration;

    const existingLessonIndex = enrollment.completedLessons.findIndex(
      (cl) => cl.lessonId.toString() === lessonId
    );

    if (existingLessonIndex !== -1) {
      enrollment.completedLessons[existingLessonIndex].videoProgress = {
        watchedDuration,
        totalDuration: lessonVideo.duration,
        lastWatchedPosition,
      };

      if (
        shouldMarkComplete &&
        !enrollment.completedLessons[existingLessonIndex].completedAt
      ) {
        enrollment.completedLessons[existingLessonIndex].completedAt =
          new Date();
      }
    } else {
      enrollment.completedLessons.push({
        moduleId: lesson.moduleId,
        lessonId: new mongoose.Types.ObjectId(lessonId),
        lessonType: "video",
        videoProgress: {
          watchedDuration,
          totalDuration: lessonVideo.duration,
          lastWatchedPosition,
        },
        completedAt: shouldMarkComplete ? new Date() : undefined,
      });
    }

    // recalculate progress if lesson completed
    if (shouldMarkComplete) {
      const modules = await Module.find({ courseId });

      let totalLessons = 0;
      if (modules) {
        for (const cModule of modules) {
          const lessons = await Lesson.find({ moduleId: cModule._id });
          totalLessons += lessons.length;
        }
      }

      const completedCount = enrollment.completedLessons.filter(
        (cl) => cl.completedAt !== undefined
      ).length;

      enrollment.overallProgress =
        totalLessons > 0
          ? Math.round((completedCount / totalLessons) * 100)
          : 0;

      if (
        enrollment.overallProgress === 100 &&
        enrollment.status === "active"
      ) {
        enrollment.status = "completed";
      }
    }

    enrollment.lastAccessed = new Date();
    await enrollment.save();

    return Response.json(
      {
        success: true,
        message: shouldMarkComplete
          ? "Progress saved and lesson marked as complete!"
          : "Progress saved successfully",
        data: {
          isCompleted: shouldMarkComplete,
          watchedDuration,
          totalDuration,
          lastWatchedPosition,
          percentageWatched: (watchedDuration / totalDuration) * 100,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while saving progress");
    return Response.json(
      {
        success: false,
        message: "Error occured while saving progress",
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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You must be Student",
        },
        { status: 403 }
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
          message: "You are not enrolled in this course",
        },
        { status: 400 }
      );
    }

    const lessonProgress = enrollment.completedLessons.find(
      (cl) => cl.lessonId.toString() === lessonId
    );

    if (!lessonProgress || !lessonProgress.videoProgress) {
      return Response.json(
        {
          success: false,
          message: "Progress not found",
        },
        { status: 404 }
      );
    }

    if (lessonProgress.lessonType !== "video") {
      return Response.json(
        {
          success: false,
          message: "Progress can be fetched only for videos",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Progress fetched successfully",
        data: lessonProgress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unable to fetch progress");
    return Response.json(
      {
        success: false,
        message: "Unable to fetch progress",
      },
      { status: 500 }
    );
  }
}
