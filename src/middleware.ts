import { NextRequest, NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    const isPublic =
      path == "/sign-in" ||
      path == "/sign-up" ||
      path == "/forgot-password" ||
      path == "/reset-password";

    const token = request.cookies.get("token")?.value || "";

    if (isPublic && token) {
      return NextResponse.redirect(new URL("/courses", request.nextUrl));
    }

    if (!isPublic && !token) {
      return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid Token" },
      { status: 401 }
    );
  }
}

export const config = {
  // TODO: add routes
  matcher: [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/courses/:path*",
  ],
};
