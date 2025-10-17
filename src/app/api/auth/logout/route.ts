import dbConnect from "@/lib/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Error occured during logout",
      },
      { status: 500 }
    );
  }
}
