import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { cookies } from "next/headers";

const generateAuthToken = (
  _id: Types.ObjectId,
  name: string,
  email: string
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ _id: _id.toString(), name, email }, secret, {
    expiresIn: "7d",
  });
};

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { email, password } = await request.json();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified === false) {
        return Response.json(
          {
            success: false,
            message:
              "User not verified. Please verify your email by signing up",
          },
          {
            status: 400,
          }
        );
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (!isPasswordCorrect) {
        return Response.json(
          {
            success: false,
            message: "Incorrect Password",
          },
          {
            status: 400,
          }
        );
      }

      const token = generateAuthToken(
        existingUser._id as Types.ObjectId,
        existingUser.name,
        existingUser.email
      );

      // console.log("Token: ", token);

      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
      });

      return Response.json(
        {
          success: true,
          message: "User Logged In successfully",
          data: {
            user: {
              _id: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              role: existingUser.role,
              profile: existingUser.profile,
              isVerified: existingUser.isVerified,
            },
            token,
          },
        },
        {
          status: 200,
        }
      );
    } else {
      return Response.json(
        {
          success: false,
          message: "User does not exists",
        },
        {
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Something went wrong", error);
    return Response.json(
      {
        success: false,
        message: "Error while logging in",
      },
      {
        status: 500,
      }
    );
  }
}
