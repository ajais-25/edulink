"use client";

import { useRef, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Video,
  HelpCircle,
  Image,
  Upload,
  Clock,
  Award,
  Check,
  Star,
  PlayCircle,
  Smartphone,
  Infinity,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useAppSelector } from "@/redux/hooks";

interface Thumbnail {
  fileId: string;
  url: string;
}

interface Rating {
  userId: string;
  rating: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    profile: {
      avatar: {
        fileId: string;
        url: string;
      };
    };
  };
  thumbnail: Thumbnail;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  ratings: Rating[];
  learnings: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Module {
  _id: string;
  courseId: string;
  title: string;
}

interface Lesson {
  _id: string;
  moduleId: string;
  title: string;
  type: "video" | "quiz";
  videoId?: string;
  quizId?: string;
  video?: {
    duration: number;
  };
}

interface UIModule extends Module {
  lessons: Lesson[];
}

interface EditingLesson extends Lesson {
  // moduleId is already in Lesson
}

export default function CourseManagementPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const expandedModuleId = searchParams.get("expandedModule");

  const { user, isAuthenticated } = useAppSelector((state) => state.user);
  const isInstructor =
    (isAuthenticated && user?.role === "instructor") || false;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<UIModule[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingModule, setEditingModule] = useState<UIModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(
    null
  );
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const [showLessonTypeModal, setShowLessonTypeModal] = useState<string | null>(
    null
  );
  const [showVideoUploadModal, setShowVideoUploadModal] = useState<
    string | null
  >(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [priceInput, setPriceInput] = useState<string>("");

  // Learnings state
  const [newLearning, setNewLearning] = useState("");
  const [editingLearningIndex, setEditingLearningIndex] = useState<
    number | null
  >(null);
  const [editingLearningText, setEditingLearningText] = useState("");

  // Imagekit section
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const abortController = new AbortController();

  const authenticator = async () => {
    try {
      const response = await fetch("/api/imagekit-auth");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  const handleUpload = async (moduleId: string) => {
    if (!videoFile) {
      alert("Please select a file to upload");
      return;
    }

    const file = videoFile;
    setIsUploading(true);

    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      console.error("Failed to authenticate for upload:", authError);
      setIsUploading(false);
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    try {
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        onProgress: (event) => {
          setProgress((event.loaded / event.total) * 100);
        },
        abortSignal: abortController.signal,
      });
      console.log("Upload response:", uploadResponse);

      const axiosData = {
        title: videoTitle,
        type: "video",
        imagekit: uploadResponse,
      };

      const response = await api.post(
        `/api/courses/${courseId}/modules/${moduleId}/lessons`,
        axiosData
      );

      console.log(response);

      // Close modal and refresh data silently
      setShowVideoUploadModal(null);
      setVideoFile(null);
      setVideoTitle("");
      setProgress(0);
      fetchData(false);
    } catch (error) {
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        console.error("Upload error:", error);
      }
      alert("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get(`/api/courses/${courseId}`);

      const fetchedCourse = res.data.data.course;
      const fetchedModules: UIModule[] = res.data.data.modules;

      setCourse(fetchedCourse);
      setModules(fetchedModules);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  useEffect(() => {
    if (expandedModuleId) {
      setExpandedModules((prev) =>
        prev.includes(expandedModuleId) ? prev : [...prev, expandedModuleId]
      );
      // Optional: scroll to module
    }
  }, [expandedModuleId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleCourseEdit = () => {
    if (course) {
      setEditingCourse({ ...course });
      setPriceInput(course.price?.toString() || "");
      setThumbnailFile(null);
      setIsEditingCourse(true);
    }
  };

  const handleCourseSave = async () => {
    if (editingCourse) {
      try {
        await api.patch(`/api/courses/${courseId}`, {
          title: editingCourse.title,
          description: editingCourse.description,
          category: editingCourse.category,
          level: editingCourse.level,
          price: editingCourse.price,
          learnings: editingCourse.learnings,
        });
      } catch (error) {
        console.error("Error updating course:", error);
      }
      setCourse(editingCourse);
      setIsEditingCourse(false);
      setEditingCourse(null);
      setPriceInput("");
      setThumbnailFile(null);
    }
  };

  const handleCourseCancel = () => {
    setIsEditingCourse(false);
    setEditingCourse(null);
    setPriceInput("");
    setThumbnailFile(null);
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const authParams = await authenticator();
      const { signature, expire, token, publicKey } = authParams;

      setIsUploadingThumbnail(true);
      const uploadResponse = await upload({
        file,
        fileName: file.name,
        expire,
        token,
        signature,
        publicKey,
        onProgress: (event) => {
          console.log(
            `Thumbnail upload progress: ${(event.loaded / event.total) * 100}%`
          );
        },
      });

      const newThumbnail: Thumbnail = {
        fileId: uploadResponse.fileId as string,
        url: uploadResponse.url as string,
      };

      await api.patch(`/api/courses/${courseId}/change-thumbnail`, {
        imagekit: uploadResponse,
      });

      if (course) {
        setCourse({ ...course, thumbnail: newThumbnail });
      }
      if (editingCourse) {
        setEditingCourse({ ...editingCourse, thumbnail: newThumbnail });
      }
    } catch (error) {
      console.error("Error updating thumbnail:", error);
      alert("Failed to update thumbnail");
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    try {
      setIsPublishing(true);
      const newStatus = !course.isPublished;
      await api.patch(`/api/courses/${courseId}/toggle-publish-status`);

      setCourse({ ...course, isPublished: newStatus });
      if (editingCourse) {
        setEditingCourse({ ...editingCourse, isPublished: newStatus });
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Failed to update publish status");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleModuleEdit = (moduleId: string) => {
    const module = modules.find((m) => m._id === moduleId);
    if (module) {
      setEditingModule({ ...module });
    }
  };

  const handleModuleSave = async () => {
    if (editingModule) {
      try {
        await api.patch(
          `/api/courses/${courseId}/modules/${editingModule._id}`,
          {
            title: editingModule.title,
          }
        );
      } catch (error) {
        console.error("Error updating module:", error);
      }

      setModules(
        modules.map((m) => (m._id === editingModule._id ? editingModule : m))
      );
      setEditingModule(null);
    }
  };

  const handleLessonEdit = (moduleId: string, lessonId: string) => {
    const module = modules.find((m) => m._id === moduleId);
    const lesson = module?.lessons.find((l) => l._id === lessonId);
    if (lesson) {
      setEditingLesson({ ...lesson });
    }
  };

  const handleLessonSave = async () => {
    if (editingLesson) {
      try {
        await api.patch(
          `/api/courses/${courseId}/modules/${editingLesson.moduleId}/lessons/${editingLesson._id}`,
          {
            title: editingLesson.title,
          }
        );
      } catch (error) {
        console.error("Error updating lesson:", error);
      }

      setModules(
        modules.map((m) => {
          if (m._id === editingLesson.moduleId) {
            return {
              ...m,
              lessons: m.lessons.map((l) =>
                l._id === editingLesson._id ? editingLesson : l
              ),
            };
          }
          return m;
        })
      );
      setEditingLesson(null);
    }
  };

  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  const addModule = () => {
    setIsAddingModule(true);
    setNewModuleTitle("");
  };

  const saveNewModule = async () => {
    if (!newModuleTitle.trim()) return;

    try {
      const res = await api.post(`/api/courses/${courseId}/modules`, {
        title: newModuleTitle,
      });

      console.log(res.data);

      if (res.data.success) {
        setIsAddingModule(false);
        setNewModuleTitle("");
        fetchData(); // Refresh list
      }
    } catch (error) {
      console.error("Error creating module", error);
      alert("Failed to create module");
    }
  };

  const openLessonTypeModal = (moduleId: string) => {
    setShowLessonTypeModal(moduleId);
  };

  const selectLessonType = (type: "video" | "quiz") => {
    if (type === "video") {
      setVideoTitle("");
      setShowVideoUploadModal(showLessonTypeModal);
    } else {
      router.push(
        `/courses/${courseId}/create-quiz?moduleId=${showLessonTypeModal}`
      );
    }
    setShowLessonTypeModal(null);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    }
  };

  const deleteModule = async (moduleId: string) => {
    const moduleToDelete = modules.find((m) => m._id === moduleId);
    const lessonCount = moduleToDelete?.lessons.length || 0;

    const isConfirmed = window.confirm(
      `Are you sure you want to delete this module? It currently has ${lessonCount} lesson${
        lessonCount !== 1 ? "s" : ""
      }.`
    );

    if (!isConfirmed) return;

    try {
      await api.delete(`/api/courses/${courseId}/modules/${moduleId}`);
      setModules(modules.filter((m) => m._id !== moduleId));
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("Failed to delete module");
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    try {
      await api.delete(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
      );
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }

    setModules(
      modules.map((m) => {
        if (m._id === moduleId) {
          return { ...m, lessons: m.lessons.filter((l) => l._id !== lessonId) };
        }
        return m;
      })
    );
  };

  const handleAddLearning = async () => {
    if (!newLearning.trim() || !course) return;

    const updatedLearnings = [...(course.learnings || []), newLearning.trim()];

    // Optimistic update
    const updatedCourse = { ...course, learnings: updatedLearnings };
    setCourse(updatedCourse);
    setNewLearning("");

    // Also update editing course if it's active
    if (editingCourse) {
      setEditingCourse({ ...editingCourse, learnings: updatedLearnings });
    }

    try {
      await api.patch(`/api/courses/${courseId}`, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        learnings: updatedLearnings,
      });
    } catch (error) {
      console.error("Error updating learnings:", error);
    }
  };

  const handleUpdateLearning = async (index: number) => {
    if (!editingLearningText.trim() || !course) return;

    const updatedLearnings = [...(course.learnings || [])];
    updatedLearnings[index] = editingLearningText.trim();

    // Optimistic update
    const updatedCourse = { ...course, learnings: updatedLearnings };
    setCourse(updatedCourse);
    setEditingLearningIndex(null);
    setEditingLearningText("");

    if (editingCourse) {
      setEditingCourse({ ...editingCourse, learnings: updatedLearnings });
    }

    try {
      await api.patch(`/api/courses/${courseId}`, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        learnings: updatedLearnings,
      });
    } catch (error) {
      console.error("Error updating learnings:", error);
    }
  };

  const handleDeleteLearning = async (index: number) => {
    if (!course) return;

    const updatedLearnings = (course.learnings || []).filter(
      (_, i) => i !== index
    );

    // Optimistic update
    const updatedCourse = { ...course, learnings: updatedLearnings };
    setCourse(updatedCourse);

    if (editingCourse) {
      setEditingCourse({ ...editingCourse, learnings: updatedLearnings });
    }

    try {
      await api.patch(`/api/courses/${courseId}`, {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        learnings: updatedLearnings,
      });
    } catch (error) {
      console.error("Error updating learnings:", error);
    }
  };

  const totalLessons = modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0
  );
  const totalDuration = modules.reduce((total, module) => {
    return (
      total +
      module.lessons.reduce((moduleTotal, lesson) => {
        return moduleTotal + (lesson.video?.duration || 0);
      }, 0)
    );
  }, 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayCourse =
    isEditingCourse && editingCourse ? editingCourse : course;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Hero Section */}
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <button
            onClick={() => router.push("/courses")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3 space-y-6">
              {isEditingCourse ? (
                <input
                  type="text"
                  value={editingCourse?.title || ""}
                  onChange={(e) =>
                    setEditingCourse(
                      editingCourse
                        ? { ...editingCourse, title: e.target.value }
                        : null
                    )
                  }
                  className="w-full text-3xl lg:text-4xl font-bold bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                  {displayCourse.title}
                </h1>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-yellow-400">
                  <span className="font-bold">
                    {displayCourse.ratings && displayCourse.ratings.length > 0
                      ? (
                          displayCourse.ratings.reduce(
                            (acc, curr) => acc + curr.rating,
                            0
                          ) / displayCourse.ratings.length
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <span className="text-blue-200 underline ml-1">
                    ({displayCourse.ratings?.length || 0} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <span className="font-medium">
                    {displayCourse.enrollmentCount.toLocaleString()} students
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      displayCourse.instructor.profile.avatar.url ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                    }
                    alt="Instructor"
                    className="w-10 h-10 rounded-full border-2 border-gray-700"
                  />
                  <div>
                    <p className="text-sm text-gray-400">Created by</p>
                    <p className="text-blue-300 font-medium hover:underline cursor-pointer">
                      {displayCourse.instructor?.name || "Unknown Instructor"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-sm ml-4">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last updated{" "}
                    {displayCourse.updatedAt
                      ? new Date(displayCourse.updatedAt).toLocaleDateString(
                          "en-GB"
                        )
                      : "Recently"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {isEditingCourse ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingCourse?.category || ""}
                      onChange={(e) =>
                        setEditingCourse(
                          editingCourse
                            ? { ...editingCourse, category: e.target.value }
                            : null
                        )
                      }
                      className="px-3 py-1 rounded text-xs font-semibold bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Category"
                    />
                    <select
                      value={editingCourse?.level || "beginner"}
                      onChange={(e) =>
                        setEditingCourse(
                          editingCourse
                            ? {
                                ...editingCourse,
                                level: e.target.value as
                                  | "beginner"
                                  | "intermediate"
                                  | "advanced",
                              }
                            : null
                        )
                      }
                      className="px-3 py-1 rounded text-xs font-semibold bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white">
                      {displayCourse.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        displayCourse.level.toLowerCase() === "beginner"
                          ? "bg-green-600 text-white"
                          : displayCourse.level.toLowerCase() === "intermediate"
                            ? "bg-yellow-600 text-white"
                            : "bg-red-600 text-white"
                      }`}
                    >
                      {displayCourse.level.charAt(0).toUpperCase() +
                        displayCourse.level.slice(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Column */}
          <div className="lg:w-2/3 space-y-8">
            {/* What you'll learn (Placeholder) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What you'll learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(displayCourse.learnings || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    {editingLearningIndex === i ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingLearningText}
                          onChange={(e) =>
                            setEditingLearningText(e.target.value)
                          }
                          className="flex-1 px-2 py-1 text-sm text-gray-900 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateLearning(i);
                            if (e.key === "Escape")
                              setEditingLearningIndex(null);
                          }}
                        />
                        <button
                          onClick={() => handleUpdateLearning(i)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingLearningIndex(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Check className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm flex-1">
                          {item}
                        </span>
                        {isInstructor && !isEditingCourse && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingLearningIndex(i);
                                setEditingLearningText(item);
                              }}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteLearning(i)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {isInstructor && !isEditingCourse && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a new learning outcome..."
                    value={newLearning}
                    onChange={(e) => setNewLearning(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLearning()}
                    className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleAddLearning}
                    disabled={!newLearning.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    Course Content
                  </h2>
                  {isInstructor && (
                    <button
                      onClick={addModule}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Add Module
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{modules.length} sections</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{totalLessons} lectures</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{formatTotalDuration(totalDuration)} total length</span>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {modules.map((module) => {
                  // Check if we are editing this specific module
                  const isEditingThisModule = editingModule?._id === module._id;

                  return (
                    <div key={module._id} className="group">
                      <div
                        onClick={() => toggleModule(module._id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {expandedModules.includes(module._id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}

                          {/* Inline Edit or Display Title */}
                          {isEditingThisModule ? (
                            <div
                              className="flex items-center gap-2 flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingModule.title}
                                autoFocus
                                onChange={(e) =>
                                  setEditingModule({
                                    ...editingModule,
                                    title: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleModuleSave();
                                  if (e.key === "Escape")
                                    setEditingModule(null);
                                }}
                                className="flex-1 px-3 py-1 font-semibold text-gray-900 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                              <button
                                onClick={handleModuleSave}
                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingModule(null)}
                                className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {module.title}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {module.lessons.length} lectures
                              </p>
                            </div>
                          )}
                        </div>

                        {!isEditingThisModule && isInstructor && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModuleEdit(module._id);
                              }}
                              className="p-1.5 hover:bg-white rounded-md text-gray-600 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteModule(module._id);
                              }}
                              className="p-1.5 hover:bg-red-100 rounded-md text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      {expandedModules.includes(module._id) && (
                        <div className="bg-white divide-y divide-gray-100">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson._id}
                              className="flex items-center justify-between p-3 pl-12 hover:bg-gray-50 group transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {lesson.type === "video" ? (
                                  <PlayCircle className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <HelpCircle className="w-4 h-4 text-gray-400" />
                                )}

                                {editingLesson?._id === lesson._id ? (
                                  <div className="flex-1 flex gap-2 mr-4">
                                    <input
                                      type="text"
                                      value={editingLesson.title}
                                      onChange={(e) =>
                                        setEditingLesson({
                                          ...editingLesson,
                                          title: e.target.value,
                                        })
                                      }
                                      className="flex-1 px-2 py-1 text-gray-900 bg-white border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                    />
                                    <button
                                      onClick={handleLessonSave}
                                      className="p-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingLesson(null)}
                                      className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <a
                                    href="#"
                                    className="text-sm text-gray-700 hover:text-blue-600 group-hover:underline"
                                  >
                                    {lesson.title}
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                {lesson.type === "video" && (
                                  <span className="text-xs text-gray-500">
                                    {formatDuration(
                                      lesson.video?.duration as number
                                    ) || "00:00"}
                                  </span>
                                )}
                                {isInstructor && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        handleLessonEdit(module._id, lesson._id)
                                      }
                                      className="p-1 hover:bg-gray-200 rounded text-gray-600 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteLesson(module._id, lesson._id)
                                      }
                                      className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {isInstructor && (
                            <button
                              onClick={() => openLessonTypeModal(module._id)}
                              className="w-full py-3 flex items-center justify-center gap-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Add Lesson
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* New Module Input Row */}
                {isAddingModule && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={newModuleTitle}
                          autoFocus
                          placeholder="Enter module title..."
                          onChange={(e) => setNewModuleTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveNewModule();
                            if (e.key === "Escape") setIsAddingModule(false);
                          }}
                          className="flex-1 px-3 py-2 text-gray-900 bg-white border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={saveNewModule}
                          disabled={!newModuleTitle.trim()}
                          className="p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setIsAddingModule(false)}
                          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              {isEditingCourse ? (
                <textarea
                  value={editingCourse?.description || ""}
                  onChange={(e) =>
                    setEditingCourse(
                      editingCourse
                        ? { ...editingCourse, description: e.target.value }
                        : null
                    )
                  }
                  className="w-full h-40 p-4 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
                  placeholder="Enter course description..."
                />
              ) : (
                <div className="prose max-w-none text-gray-700">
                  {displayCourse.description}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:w-1/3">
            <div className="sticky top-8 space-y-6">
              {/* Course Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="relative">
                  <div className="relative group cursor-pointer">
                    <img
                      src={course.thumbnail?.url}
                      alt="Course Preview"
                      className="w-full h-48 object-cover"
                    />

                    {isInstructor && (
                      <label className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {isUploadingThumbnail ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        ) : (
                          <Image className="w-8 h-8 text-white mb-2" />
                        )}
                        <span className="text-white text-sm font-medium">
                          {isUploadingThumbnail
                            ? "Uploading..."
                            : "Change Thumbnail"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          disabled={isUploadingThumbnail}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-end gap-3 mb-6">
                    {isEditingCourse ? (
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={priceInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPriceInput(val);
                            setEditingCourse(
                              editingCourse
                                ? {
                                    ...editingCourse,
                                    price:
                                      val === "" ? 0 : parseFloat(val) || 0,
                                  }
                                : null
                            );
                          }}
                          className="w-32 text-3xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-gray-900">
                          ₹{displayCourse.price}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    {isInstructor ? (
                      isEditingCourse ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={handleCourseSave}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors cursor-pointer"
                          >
                            <Save className="w-5 h-5" />
                            Save
                          </button>
                          <button
                            onClick={handleCourseCancel}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleCourseEdit}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-5 h-5" />
                          Edit Course
                        </button>
                      )
                    ) : (
                      <button className="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors cursor-pointer">
                        Buy Now
                      </button>
                    )}
                    {!isEditingCourse && (
                      <p className="text-center text-xs text-gray-500">
                        30-Day Money-Back Guarantee
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900">
                      This course includes:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-600">
                        <Video className="w-5 h-5 text-gray-400" />
                        <span>
                          {formatTotalDuration(totalDuration)} on-demand video
                        </span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-600">
                        <Smartphone className="w-5 h-5 text-gray-400" />
                        <span>Access on mobile and TV</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-600">
                        <Infinity className="w-5 h-5 text-gray-400" />
                        <span>Full lifetime access</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-600">
                        <Award className="w-5 h-5 text-gray-400" />
                        <span>Certificate of completion</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Published Status (Instructor Only) */}
              {isInstructor && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Course Status
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        displayCourse.isPublished
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {displayCourse.isPublished ? "Published" : "Draft"}
                    </span>
                    <button
                      onClick={handlePublishToggle}
                      disabled={isPublishing}
                      className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPublishing
                        ? "Updating..."
                        : displayCourse.isPublished
                          ? "Unpublish"
                          : "Publish"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLessonTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ animationFillMode: "forwards" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
              <h3 className="text-xl font-bold text-white">Add New Lesson</h3>
              <p className="text-blue-100 text-sm mt-1">
                Choose the type of content you want to create
              </p>
            </div>

            {/* Options */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectLessonType("video")}
                  className="group relative p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 hover:scale-[1.02] transition-all duration-200 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:shadow-blue-300 group-hover:scale-110 transition-all duration-200">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-gray-900 block">
                      Video Lesson
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Upload video content
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => selectLessonType("quiz")}
                  className="group relative p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 border-2 border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-lg hover:shadow-slate-100 hover:scale-[1.02] transition-all duration-200 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 group-hover:shadow-slate-300 group-hover:scale-110 transition-all duration-200">
                    <HelpCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold text-gray-900 block">Quiz</span>
                    <span className="text-xs text-gray-500 mt-1 block">
                      Test student knowledge
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowLessonTypeModal(null)}
                className="mt-6 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ animationFillMode: "forwards" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Upload Video Lesson
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Add engaging video content to your course
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Lesson Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g., Introduction to React Hooks"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isUploading
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                    : videoFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {!videoFile ? (
                  <>
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Drag and drop your video file here
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                      Supports MP4, MOV, AVI, and more
                    </p>
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 cursor-pointer transition-colors shadow-md shadow-blue-200">
                      <Upload className="w-4 h-4" />
                      Browse Files
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        ref={fileInputRef}
                        className="hidden"
                      />
                    </label>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Check className="w-7 h-7 text-green-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-gray-900 font-semibold truncate">
                        {videoFile.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => setVideoFile(null)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar (shows during upload) */}
              {(isUploading || progress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">
                      {isUploading
                        ? "Uploading & Processing..."
                        : "Upload complete"}
                    </span>
                    <span className="text-blue-600 font-semibold">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() =>
                  showVideoUploadModal && handleUpload(showVideoUploadModal)
                }
                disabled={!videoFile || !videoTitle || isUploading}
                className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  videoFile && videoTitle && !isUploading
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md shadow-green-200 cursor-pointer"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Video Lesson
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowVideoUploadModal(null);
                  setVideoFile(null);
                  setVideoTitle("");
                }}
                disabled={isUploading}
                className="px-5 py-3 bg-white border-2 border-gray-200 cursor-pointer text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
