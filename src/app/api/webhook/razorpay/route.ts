import { NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import { sendCourseEnrolledEmail } from "@/helpers/sendCourseEnrolledEmail";
import { sendPaymentFailedEmail } from "@/helpers/sendPaymentFailedEmail";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return Response.json(
        {
          success: false,
          message: "Invalid signature",
        },
        { status: 400 },
      );
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      console.log("payment", payment);

      const order = await Order.findOneAndUpdate(
        { orderId: payment.order._id },
        {
          paymentId: payment.id,
          status: "completed",
        },
      );

      if (order) {
        await Enrollment.create({
          student: order.userId,
          course: order.courseId,
          status: "active",
        });

        const user = await User.findById(order.userId).select("-password");

        const course = await Course.findById(order.courseId).populate({
          path: "instructor",
          select: "name",
        });

        if (user && course) {
          course.enrollmentCount += 1;
          await course.save();

          const instructor = course?.instructor as unknown as { name: string };

          await sendCourseEnrolledEmail(
            user.name,
            user.email,
            course?.title,
            course?.description,
            instructor?.name,
            course?.level,
            course?.thumbnail?.url,
            `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course?._id}`,
          );
        }
      }
    } else if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      console.log("payment", payment);

      const order = await Order.findOneAndUpdate(
        { orderId: payment.order._id },
        {
          paymentId: payment.id,
          status: "failed",
        },
      );

      console.log("Payment failed for order:", payment.order._id);

      if (order) {
        const user = await User.findById(order.userId).select("-password");

        const course = await Course.findById(order.courseId).populate({
          path: "instructor",
          select: "name",
        });

        if (user && course) {
          const instructor = course?.instructor as unknown as { name: string };

          await sendPaymentFailedEmail(
            user.name,
            user.email,
            course?.title,
            course?.description,
            instructor?.name,
            course?.level,
            course?.thumbnail?.url,
            String(order.amount),
            "INR",
            order.orderId,
            `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${course?._id}`,
          );
        }
      }
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
