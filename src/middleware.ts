import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-code",
];

export default async function middleware(request: NextRequest) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");

  const encodedSecret = new TextEncoder().encode(secret);
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  const nextPath = `${path}${request.nextUrl.search}`;
  const signInUrl = new URL("/sign-in", request.nextUrl);
  signInUrl.searchParams.set("next", nextPath);

  const isPublic = publicRoutes.some(
    (route) =>
      path === route || (route !== "/" && path.startsWith(route + "/")),
  );

  try {
    if (!isPublic && !token) {
      return NextResponse.redirect(signInUrl);
    }

    if (token) {
      await jwtVerify(token, encodedSecret);

      if (isPublic) {
        return NextResponse.redirect(new URL("/courses", request.nextUrl));
      }
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(signInUrl);

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
    "/my-orders/:path*",
  ],
};
