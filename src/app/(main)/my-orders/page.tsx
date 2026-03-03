"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { useAppSelector } from "@/redux/hooks";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  XCircle,
} from "lucide-react";
import type { Course } from "@/components/CourseCard";

interface Order {
  _id: string;
  orderId: string;
  paymentId?: string;
  amount: number; // Stored in paise
  status: "pending" | "completed" | "failed";
  createdAt: string;
  courseId: Course | null;
}

const statusBadgeStyles: Record<
  Order["status"],
  { bg: string; text: string; icon: ReactElement }
> = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock3 className="h-4 w-4" />,
  },
  completed: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  failed: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const formatAmount = (amountInPaise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format((amountInPaise || 0) / 100);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function MyOrdersPage() {
  const { user } = useAppSelector((state) => state.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Only students are allowed to view orders
        if (!user || user.role !== "student") {
          setLoading(false);
          return;
        }

        const response = await api.get("/api/orders/users");

        if (response.data.success) {
          setOrders(response.data.data || []);
        }
      } catch (error: any) {
        console.error("Error fetching orders", error);
        toast.error(
          error?.response?.data?.message ||
            "Failed to load your orders. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const stats = useMemo(() => {
    const completed = orders.filter((order) => order.status === "completed");
    const pending = orders.filter((order) => order.status === "pending");
    const failed = orders.filter((order) => order.status === "failed");
    const totalSpent = completed.reduce((sum, order) => sum + order.amount, 0);

    return {
      completed: completed.length,
      pending: pending.length,
      failed: failed.length,
      totalSpent,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-500 font-medium">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-lg text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sign in required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view your course orders and payment history.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-lg text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Students only
          </h2>
          <p className="text-gray-600">
            Orders are available for students. Switch to a student role to view
            your purchases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Track your purchases
                </h1>
                <p className="text-gray-600 mt-1">
                  Review payment status and jump back into your courses.
                </p>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div className="text-sm font-medium text-indigo-700">
                  Total spent
                </div>
                <div className="mt-2 text-2xl font-bold text-indigo-900">
                  {formatAmount(stats.totalSpent)}
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="text-sm font-medium text-emerald-700">
                  Completed
                </div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-emerald-900">
                  <CheckCircle2 className="w-5 h-5" />
                  {stats.completed}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="text-sm font-medium text-amber-700">
                  Pending
                </div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-amber-900">
                  <Clock3 className="w-5 h-5" />
                  {stats.pending}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                <div className="text-sm font-medium text-rose-700">Failed</div>
                <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-rose-900">
                  <XCircle className="w-5 h-5" />
                  {stats.failed}
                </div>
              </div>
            </div>
          </div>

          {/* Orders list */}
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
              <div className="flex justify-center mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start exploring courses and your purchases will appear here.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Browse Courses
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const course = order.courseId;
                const statusStyle = statusBadgeStyles[order.status];

                return (
                  <div
                    key={order._id}
                    className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="p-4 sm:p-6 flex flex-col gap-4 md:flex-row md:items-start">
                      <div className="w-full md:w-52 flex-shrink-0">
                        <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                          {course?.thumbnail?.url ? (
                            <img
                              src={course.thumbnail.url}
                              alt={course.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex items-center justify-center text-indigo-500 font-semibold">
                              Course
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {course?.title || "Course unavailable"}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {course?.description ||
                                "This course is no longer available."}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.icon}
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Order ID</p>
                            <p className="text-sm font-semibold text-gray-800 break-all">
                              {order.orderId}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Payment ID</p>
                            <p className="text-sm font-semibold text-gray-800 break-all">
                              {order.paymentId || "Pending"}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500">Placed on</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="text-lg font-bold text-gray-900">
                            {formatAmount(order.amount)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            {course && (
                              <Link
                                href={`/courses/${course._id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                {order.status === "completed"
                                  ? "Go to course"
                                  : "View course"}
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>
                            )}
                            <span className="text-xs text-gray-500">
                              Ordered via EduLink • {order.orderId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
