"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import CourseCard, { Course } from "@/components/CourseCard";
import { useAppSelector } from "@/redux/hooks";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function MyCoursesPage() {
  const { user } = useAppSelector((state) => state.user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await api.get("/api/my-courses");

        if (response.data.success) {
          let courseData = response.data.data;

          // If user is student, the data contains enrollments with nested course object
          if (user?.role === "student") {
            // Map enrollments to courses, filtering out any null courses (if enrollment exists but course deleted)
            courseData = courseData
              .map((item: any) => item.course)
              .filter((course: any) => course !== null);
          }

          setCourses(courseData);
        }
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        toast.error("Failed to fetch your courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === "instructor"
                ? "My Created Courses"
                : "My Learning"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === "instructor"
                ? "Manage and track the courses you've created"
                : "Continue learning from your enrolled courses"}
            </p>
          </div>

          {user?.role === "instructor" ? (
            <Link
              href="/courses/create"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
          ) : (
            <Link
              href="/courses"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
            >
              Browse More Courses
            </Link>
          )}
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto px-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Courses Found
              </h3>
              <p className="text-gray-500 mb-8">
                {user?.role === "instructor"
                  ? "You haven't created any courses yet. Start sharing your knowledge!"
                  : "You haven't enrolled in any courses yet. Start your learning journey!"}
              </p>
              <Link
                href={
                  user?.role === "instructor" ? "/courses/create" : "/courses"
                }
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {user?.role === "instructor"
                  ? "Create Your First Course"
                  : "Explore Courses"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
