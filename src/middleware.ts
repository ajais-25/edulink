import { NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-code",
];

export default async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;

    const isPublic = publicRoutes.some(
      (route) => path === route || path.startsWith(route + "/")
    );

    const token = request.cookies.get("token")?.value || "";

    if (isPublic && token) {
      return NextResponse.redirect(new URL("/courses", request.nextUrl));
    }

    if (!isPublic && !token) {
      return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid Token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-code",
    "/",
    "/courses/:path*",
    "/my-courses/:path*",
    "/profile/:path*",
  ],
};
