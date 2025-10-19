import User from "@/models/User";
import dbConnect from "@/lib/dbConnect";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    return Response.json(
      {
        success: true,
        message: "User profile fetched successfully",
        data: user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Something went wrong while fetching profile");
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  await dbConnect();

  try {
    const { bio, avatar, linkedIn, twitter } = await request.json();

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

    user.profile.bio = bio;
    user.profile.avatar = avatar;

    if (user.profile.socialLinks) {
      user.profile.socialLinks.linkedIn = linkedIn;
      user.profile.socialLinks.twitter = twitter;
    }

    await user.save();

    return Response.json(
      {
        success: false,
        message: "Profile updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while updating profile");
    return Response.json(
      {
        success: false,
        message: "Error while updating profile",
      },
      { status: 500 }
    );
  }
}
