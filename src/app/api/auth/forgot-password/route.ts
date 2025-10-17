import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateRandomToken } from "@/helpers/generateRandomToken";
import bcrypt from "bcryptjs";
import PasswordReset from "@/models/PasswordReset";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Please provide a vaild email",
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return Response.json(
        {
          success: true,
          message: "If the email exists, a reset link has been sent",
        },
        { status: 200 }
      );
    }

    const resetToken = generateRandomToken(16);
    const hashedToken = await bcrypt.hash(resetToken, 10);

    const expiresAt = new Date(Date.now() + 60 * 15);

    const passwordReset = new PasswordReset({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      isUsed: false,
    });

    await passwordReset.save();

    // TODO: send password reset email

    return Response.json(
      {
        success: true,
        message: "If the email exists, a reset link has been sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error");
    return Response.json(
      {
        success: false,
        message: "An error occured. Please try again later",
      },
      { status: 500 }
    );
  }
}
