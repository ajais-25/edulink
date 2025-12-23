import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Module from "@/models/Module";
import User from "@/models/User";
import Video, { Video as VideoType } from "@/models/Video";
import VideoProgress from "@/models/VideoProgress";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

void Video;

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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be a Student for this",
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

    const courseModule = await Module.findOne({ _id: moduleId, courseId });

    if (!courseModule) {
      return Response.json(
        {
          success: false,
          message: "Module not found or does not belong to this course",
        },
        { status: 404 }
      );
    }

    const lesson = await Lesson.findOne({ _id: lessonId, moduleId }).populate(
      "videoId"
    );

    if (!lesson) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found or does not belong to this module",
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
          message: "You are not enrolled in this course",
        },
        { status: 400 }
      );
    }

    const lessonVideo = lesson.videoId as unknown as VideoType;

    if (!lessonVideo || !lessonVideo.duration || lessonVideo.duration <= 0) {
      return Response.json(
        {
          success: false,
          message: "Video not found or has invalid duration",
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

    const shouldMarkComplete = watchedDuration >= totalDuration;

    const existingProgress = await VideoProgress.findOne({
      courseId,
      moduleId,
      lessonId,
      studentId: userId,
    });

    if (existingProgress) {
      if (
        watchedDuration > existingProgress.watchedDuration ||
        shouldMarkComplete
      ) {
        existingProgress.watchedDuration = watchedDuration;
        existingProgress.totalDuration = lessonVideo.duration;
        existingProgress.lastWatchedPosition = lastWatchedPosition;
        existingProgress.isCompleted =
          existingProgress.isCompleted || shouldMarkComplete;
        await existingProgress.save();
      }
    } else {
      await VideoProgress.create({
        courseId: new mongoose.Types.ObjectId(courseId),
        moduleId: new mongoose.Types.ObjectId(moduleId),
        lessonId: new mongoose.Types.ObjectId(lessonId),
        studentId: new mongoose.Types.ObjectId(userId),
        watchedDuration,
        totalDuration: lessonVideo.duration,
        lastWatchedPosition,
        isCompleted: shouldMarkComplete,
      });
    }

    if (shouldMarkComplete) {
      const alreadyCompleted = enrollment.completedLessons.some(
        (cl) => cl.lessonId.toString() === lessonId
      );

      if (!alreadyCompleted) {
        enrollment.completedLessons.push({
          moduleId: new mongoose.Types.ObjectId(moduleId),
          lessonId: new mongoose.Types.ObjectId(lessonId),
          lessonType: "video",
          completedAt: new Date(),
        });
      }

      const modules = await Module.find({ courseId });

      let totalLessons = 0;
      if (modules) {
        for (const cModule of modules) {
          const lessons = await Lesson.find({ moduleId: cModule._id });
          totalLessons += lessons.length;
        }
      }

      const completedCount = enrollment.completedLessons.length;
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
          totalDuration: lessonVideo.duration,
          lastWatchedPosition,
          percentageWatched: (watchedDuration / lessonVideo.duration) * 100,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occurred while saving progress", error);
    return Response.json(
      {
        success: false,
        message: "Error occurred while saving progress",
      },
      { status: 500 }
    );
  }
}

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

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be a Student for this",
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

    const courseModule = await Module.findOne({ _id: moduleId, courseId });

    if (!courseModule) {
      return Response.json(
        {
          success: false,
          message: "Module not found or does not belong to this course",
        },
        { status: 404 }
      );
    }

    const lesson = await Lesson.findOne({ _id: lessonId, moduleId });

    if (!lesson) {
      return Response.json(
        {
          success: false,
          message: "Lesson not found or does not belong to this module",
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
          message: "You are not enrolled in this course",
        },
        { status: 400 }
      );
    }

    const videoProgress = await VideoProgress.findOne({
      courseId,
      moduleId,
      lessonId,
      studentId: userId,
    });

    if (!videoProgress) {
      return Response.json(
        {
          success: false,
          message: "Progress not found",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Progress fetched successfully",
        data: {
          watchedDuration: videoProgress.watchedDuration,
          totalDuration: videoProgress.totalDuration,
          lastWatchedPosition: videoProgress.lastWatchedPosition,
          isCompleted: videoProgress.isCompleted,
          percentageWatched:
            videoProgress.totalDuration > 0
              ? (videoProgress.watchedDuration / videoProgress.totalDuration) *
                100
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unable to fetch progress", error);
    return Response.json(
      {
        success: false,
        message: "Unable to fetch progress",
      },
      { status: 500 }
    );
  }
}
