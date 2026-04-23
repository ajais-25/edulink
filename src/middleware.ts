import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-code",
  "/webhook",
];

export default async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  const encodedSecret = secret ? new TextEncoder().encode(secret) : null;
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value || "";

  const isPublic = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/"),
  );

  try {
    if (!isPublic && (!token || !encodedSecret)) {
      return NextResponse.redirect(new URL("/sign-in", request.nextUrl));
    }

    if (token && encodedSecret) {
      await jwtVerify(token, encodedSecret);

      if (isPublic) {
        return NextResponse.redirect(new URL("/courses", request.nextUrl));
      }
    }

    return NextResponse.next();
  } catch (error) {
    const redirectPath = isPublic ? path : "/sign-in";
    const response = NextResponse.redirect(
      new URL(redirectPath, request.nextUrl),
    );

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
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
