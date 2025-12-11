import { getUploadAuthParams } from "@imagekit/next/server";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import User from "@/models/User";

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
        { status: 401 }
      );
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return Response.json(
        {
          success: false,
          message: "Unauthorized user",
        },
        { status: 401 }
      );
    }

    const { token, expire, signature } = getUploadAuthParams({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
    });

    return Response.json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "ImageKit auth failed",
      },
      { status: 500 }
    );
  }
}
