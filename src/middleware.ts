import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    const isPublic = path == "/login" || path == "/signup";

    const token = request.cookies.get("token")?.value || "";

    if (isPublic && token) {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }

    if (!isPublic && !token) {
      return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    }
  } catch (error) {
    return Response.json(
      { success: false, message: "Invalid Token" },
      { status: 401 }
    );
  }
}

export const config = {
  // TODO: add routes
  matcher: [],
};
