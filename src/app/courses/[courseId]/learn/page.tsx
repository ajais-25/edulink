"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  Menu,
  PlayCircle,
  Star,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import ReactPlayer from "react-player";
import QuizSummary from "@/components/QuizSummary";
import QuizAttemptsList from "@/components/QuizAttemptsList";

interface Video {
  duration: number;
  videoUrl: string;
}

interface Lesson {
  _id: string;
  moduleId: string;
  title: string;
  type: "video" | "quiz";
  video?: Video;
  isCompleted?: boolean;
  quiz?: {
    _id: string;
    timeLimit: number;
    passingScore: number;
    questionCount: number;
  };
}

interface Module {
  _id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  title: string;
  instructor: {
    _id: string;
    name: string;
  };
}

export default function CourseLearnPage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/courses/${courseId}`);
        if (res.data.success) {
          setCourse(res.data.data.course);
          setModules(res.data.data.modules);

          const firstModule = res.data.data.modules[0];
          if (firstModule && firstModule.lessons.length > 0) {
            setActiveLesson(firstModule.lessons[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching course content:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  useEffect(() => {
    const fetchQuizAttempts = async () => {
      if (!activeLesson || !courseId) return;

      if (activeLesson.type === "quiz" && activeLesson.quiz) {
        setQuizDetails(activeLesson.quiz);
      } else {
        setQuizDetails(null);
      }
      setQuizAttempts([]);

      if (activeLesson.type === "quiz") {
        try {
          setLoadingLesson(true);
          const res = await api.get(
            `/api/courses/${courseId}/modules/${activeLesson.moduleId}/lessons/${activeLesson._id}/quiz-result`
          );

          if (res.data.success) {
            const attempts = res.data.data;
            if (attempts) {
              setQuizAttempts(attempts);
            }
          }
        } catch (error) {
          console.error("Error fetching quiz attempts:", error);
        } finally {
          setLoadingLesson(false);
        }
      }
    };

    fetchQuizAttempts();
  }, [activeLesson, courseId]);

  const handleLessonSelect = (lesson: Lesson) => {
    setActiveLesson(lesson);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    try {
      setIsSubmittingRating(true);
      await api.post(`/api/courses/${courseId}/give-rating`, {
        rating,
      });
      alert("Thank you for your rating!");
      setShowRatingModal(false);
    } catch (error: any) {
      console.error("Error submitting rating:", error);
      alert(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      {/* Sidebar - Course Content */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 ease-in-out flex flex-col relative z-20 overflow-hidden`}
      >
        <div className="h-16 px-4 border-b border-gray-700 flex items-center justify-between min-w-[320px]">
          <h2 className="font-bold text-lg truncate pr-4">{course.title}</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-gray-700 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-w-[320px]">
          {modules.map((module, moduleIndex) => (
            <div key={module._id} className="border-b border-gray-700">
              <div className="px-4 py-3 bg-gray-800 font-medium text-gray-200 text-sm">
                Section {moduleIndex + 1}: {module.title}
              </div>
              <div>
                {module.lessons.map((lesson, lessonIndex) => (
                  <button
                    key={lesson._id}
                    onClick={() => handleLessonSelect(lesson)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-750 transition-colors ${
                      activeLesson?._id === lesson._id
                        ? "bg-gray-700 border-l-4 border-blue-500"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    {lesson.type === "video" ? (
                      <PlayCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          activeLesson?._id === lesson._id
                            ? "text-blue-400"
                            : "text-gray-400"
                        }`}
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        activeLesson?._id === lesson._id
                          ? "text-white font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {lessonIndex + 1}. {lesson.title}
                      {lesson.video && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {Math.floor(lesson.video.duration / 60)}:
                          {(lesson.video.duration % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation */}
        <div className="bg-gray-800 h-16 border-b border-gray-700 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 cursor-pointer"
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Course
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowRatingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Star className="w-4 h-4" />
              Rate Course
            </button>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-4 lg:p-8 flex flex-col items-center">
          <div className="w-full max-w-5xl space-y-6">
            {activeLesson ? (
              <>
                <div
                  className={`${
                    activeLesson.type === "video"
                      ? "aspect-video bg-black"
                      : "bg-gray-900"
                  } rounded-xl overflow-hidden shadow-2xl relative group`}
                >
                  {activeLesson.type === "video" && activeLesson.video ? (
                    <ReactPlayer
                      src={activeLesson.video.videoUrl}
                      width="100%"
                      height="100%"
                      controls
                      playing={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
                      {activeLesson.type === "quiz" && quizDetails ? (
                        <QuizSummary
                          quiz={quizDetails}
                          courseId={courseId as string}
                          moduleId={activeLesson.moduleId}
                          lessonId={activeLesson._id}
                        />
                      ) : (
                        <div className="text-center py-12">
                          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500" />
                          <p className="text-gray-500">This is a quiz lesson</p>
                          {loadingLesson && (
                            <p className="text-sm mt-2 text-gray-500">
                              Loading quiz details...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {activeLesson.title}
                    </h1>
                    <p className="text-gray-400 text-sm">
                      Instructor: {course.instructor.name}
                    </p>
                  </div>
                </div>

                {/* Quiz Attempts List - Moved below the title area */}
                {activeLesson.type === "quiz" && (
                  <QuizAttemptsList
                    attempts={quizAttempts}
                    isLoading={loadingLesson}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <p>Select a lesson to start learning</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-yellow-500" fill="currentColor" />
              </div>
              <h3 className="text-xl font-bold text-white">Rate this course</h3>
              <p className="text-gray-400 text-sm mt-1">
                How would you describe your experience?
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || isSubmittingRating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingRating ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
