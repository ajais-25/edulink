"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import axios from "axios";
import CourseCard, { Course } from "@/components/CourseCard";
import CreateCourseModal from "@/components/CreateCourseModal";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([
    {
      _id: "1",
      title: "Web Development Fundamentals",
      description: "Learn the basics of HTML, CSS, and JavaScript",
      thumbnail: {
        fileId: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
        url: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
      },
      category: "Development",
      level: "Beginner",
      price: 3999,
      isPublished: true,
      enrollmentCount: 1234,
      ratings: [
        { userId: "u1", rating: 5 },
        { userId: "u2", rating: 4 },
      ],
    },
    {
      _id: "2",
      title: "Advanced React Patterns",
      description: "Master advanced React concepts and design patterns",
      thumbnail: {
        fileId: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
        url: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
      },
      category: "Development",
      level: "Advanced",
      price: 7999,
      isPublished: true,
      enrollmentCount: 856,
      ratings: [],
    },
    {
      _id: "3",
      title: "UI/UX Design Masterclass",
      description: "Create beautiful and user-friendly interfaces",
      thumbnail: {
        fileId: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
        url: "https://ik.imagekit.io/your-imagekit-id/your-image.jpg",
      },
      category: "Design",
      level: "Intermediate",
      price: 6499,
      isPublished: false,
      enrollmentCount: 0,
      ratings: [],
    },
  ]);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");

  useEffect(() => {
    const getCourses = async () => {
      try {
        const response = await axios.get("/api/courses");
        if (response.data && response.data.data) {
          setCourses(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching courses");
      }
    };

    getCourses();
  }, []);

  const handleCourseCreated = (newCourse: Course) => {
    setCourses((prev) => [...prev, newCourse]);
  };

  const filteredCourses = courses.filter((course) => {
    if (!course || !course.title) return false;
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLevel =
      selectedLevel === "All" ||
      course.level.toLowerCase() === selectedLevel.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  const levels = ["All", "Beginner", "Intermediate", "Advanced"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                Explore Courses
              </h1>
              <p className="mt-2 text-lg text-gray-500 max-w-2xl">
                Discover a wide range of courses to enhance your skills and
                advance your career.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              Create New Course
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer transition-all text-gray-900"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl} Level
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No courses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      <CreateCourseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCourseCreated={handleCourseCreated}
      />
    </div>
  );
}
