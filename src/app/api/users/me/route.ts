import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
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

    return Response.json(
      {
        success: true,
        message: "Token is valid",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
