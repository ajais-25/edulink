import { NextRequest } from "next/server";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const userId = getDataFromToken(request);

    if (!userId) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized - Invalid or expired token",
        },
        { status: 401 },
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized user",
        },
        { status: 401 },
      );
    }

    if (user.role !== "student") {
      return Response.json(
        {
          success: false,
          message: "You need to be an Student to view your orders",
        },
        { status: 403 },
      );
    }

    const orders = await Order.find({ userId })
      .populate("courseId")
      .sort({ createdAt: -1 });

    return Response.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user orders", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching user orders",
      },
      { status: 500 },
    );
  }
}
