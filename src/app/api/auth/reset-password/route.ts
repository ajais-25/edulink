import dbConnect from "@/lib/dbConnect";
import PasswordReset from "@/models/PasswordReset";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    const { newPassword } = await request.json();

    if (!token || !newPassword) {
      return Response.json(
        {
          success: false,
          message: "Token and new password are required",
        },
        { status: 400 }
      );
    }

    const hashedToken = await bcrypt.hash(token, 10);

    const existingToken = await PasswordReset.findOne({
      token: hashedToken,
      expiresAt: {
        $gt: new Date(Date.now()),
      },
    });

    if (!existingToken) {
      return Response.json(
        {
          success: false,
          message: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(existingToken.userId, {
      $set: {
        password: hashedPassword,
      },
    });

    existingToken.isUsed = true;
    await existingToken.save();

    // TODO: send email on successful password reset

    return Response.json(
      {
        success: true,
        message: "Password reset succesful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("An error occured. Please try after sometime");
    return Response.json(
      {
        success: false,
        message: "An error occured. Please try again later",
      },
      { status: 500 }
    );
  }
}
