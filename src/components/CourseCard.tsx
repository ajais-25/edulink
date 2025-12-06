import Link from "next/link";
import { Users, Star, Clock } from "lucide-react";

interface Thumbnail {
  fileId: string;
  url: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: Thumbnail;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
}

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course._id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        <div className="relative overflow-hidden">
          <img
            src={course.thumbnail.url}
            alt={course.title}
            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-blue-600 backdrop-blur-md shadow-sm">
              {course.category}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                course.level === "Beginner"
                  ? "bg-green-50 text-green-600"
                  : course.level === "Intermediate"
                    ? "bg-yellow-50 text-yellow-600"
                    : "bg-red-50 text-red-600"
              }`}
            >
              {course.level}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
            {course.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{course.enrollmentCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{course.rating}</span>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {course.price === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                <span>₹{course.price.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
