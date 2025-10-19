import { getDataFromToken } from "@/helpers/getDataFromToken";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  await dbConnect();

  try {
    const userId = getDataFromToken(request);

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

    if (user.role === "student") {
      user.role = "instructor";
    } else if (user.role === "instructor") {
      user.role = "student";
    } else {
      return Response.json(
        {
          success: false,
          message: "Invalid user role",
        },
        { status: 500 }
      );
    }

    await user.save();

    return Response.json(
      {
        success: true,
        message: "User role changed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error occured while changing role");
    return Response.json(
      {
        success: false,
        message: "An error occured while updating role",
      },
      { status: 500 }
    );
  }
}
