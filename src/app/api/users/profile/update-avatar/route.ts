import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest } from "next/server";
import { deleteFile } from "@/helpers/deleteFile";

export async function PATCH(request: NextRequest) {
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

    const { imagekit } = await request.json();

    if (!imagekit || !imagekit.url) {
      return Response.json(
        {
          success: false,
          message: "Invalid file upload data",
        },
        { status: 400 }
      );
    }

    if (user.profile.avatar?.fileId) {
      await deleteFile(user.profile.avatar.fileId);
      user.profile.avatar = {
        fileId: "",
        url: "",
      };
    }

    user.profile.avatar = {
      fileId: imagekit.fileId,
      url: imagekit.url,
    };

    await user.save();

    return Response.json(
      {
        success: true,
        message: "Avatar updated successfully",
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while updating avatar");
    return Response.json(
      {
        success: false,
        message: "Error while updating avatar",
      },
      { status: 500 }
    );
  }
}
