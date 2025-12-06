import { sendPasswordResetConfirmationEmail } from "@/helpers/sendPasswordResetConfirmationEmail";
import dbConnect from "@/lib/dbConnect";
import PasswordReset from "@/models/PasswordReset";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import crypto from "crypto";

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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    const existingToken = await PasswordReset.findOne({
      token: hashedToken,
      expiresAt: {
        $gt: Date.now(),
      },
      isUsed: false,
    });

    if (!existingToken) {
      return Response.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(
      existingToken.userId,
      {
        $set: {
          password: hashedPassword,
        },
      },
      { new: true }
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    existingToken.isUsed = true;
    await existingToken.save();

    const resetDate = new Date().toLocaleString();

    await sendPasswordResetConfirmationEmail(
      user.name,
      user.email,
      resetDate,
      process.env.SUPPORT_EMAIL || ""
    );

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
