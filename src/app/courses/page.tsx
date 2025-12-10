"use client";

import { useEffect, useState } from "react";
import { Plus, Filter } from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import CourseCard, { Course } from "@/components/CourseCard";
import { useAppSelector } from "@/redux/hooks";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [sortBy, setSortBy] = useState("relevant");
  const { user, isAuthenticated } = useAppSelector((state) => state.user);

  useEffect(() => {
    const getCourses = async () => {
      try {
        const response = await api.get("/api/courses");
        if (response.data && response.data.data) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching courses");
      } finally {
        setLoading(false);
      }
    };

    getCourses();
  }, []);

  const filteredAndSortedCourses = courses
    .filter((course) => {
      if (!course || !course.title) return false;

      // Level Filter
      const matchesLevel =
        selectedLevel === "All" ||
        course.level.toLowerCase() === selectedLevel.toLowerCase();

      return matchesLevel;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rated":
          const ratingA =
            a.ratings && a.ratings.length > 0
              ? a.ratings.reduce((acc, curr) => acc + curr.rating, 0) /
                a.ratings.length
              : 0;
          const ratingB =
            b.ratings && b.ratings.length > 0
              ? b.ratings.reduce((acc, curr) => acc + curr.rating, 0) /
                b.ratings.length
              : 0;
          return ratingB - ratingA;
        case "reviewed":
          const reviewsA = a.ratings ? a.ratings.length : 0;
          const reviewsB = b.ratings ? b.ratings.length : 0;
          return reviewsB - reviewsA;
        case "newest":
          return new Date(b._id).getTime() - new Date(a._id).getTime(); // Assuming _id contains timestamp or use createdAt if available, but usually _id suffices for Mongo
        default:
          return 0; // "relevant" - unsorted/default order
      }
    });

  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Recommended courses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Discover courses to accelerate your career
            </p>
          </div>
          {isAuthenticated && user?.role === "instructor" && (
            <Link
              href="/courses/create"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {/* Level Dropdown - Pill Style */}
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-transparent hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-gray-200"
                >
                  {levels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl === "All" ? "Level" : lvl}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Sort by:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-2 pr-8 py-1 bg-transparent text-sm font-medium text-gray-900 cursor-pointer outline-none focus:underline"
              >
                <option value="relevant">Most Relevant</option>
                <option value="rated">Highest Rated</option>
                <option value="reviewed">Most Reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="text-gray-500 font-medium">Fetching courses...</p>
            </div>
          </div>
        ) : filteredAndSortedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAndSortedCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No courses found
            </h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters</p>
            <button
              onClick={() => setSelectedLevel("All")}
              className="mt-4 text-gray-900 underline font-medium hover:text-gray-700"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
