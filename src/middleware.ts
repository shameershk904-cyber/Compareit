import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/admin/login";

  // If user visits login page while already authenticated with an administrative role
  if (isLoginPage) {
    if (isLoggedIn && (userRole === "ADMIN" || userRole === "EDITOR")) {
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Protect all /admin/* and /api/admin/* routes
  if (isAdminRoute || isAdminApiRoute) {
    if (!isLoggedIn) {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check: Only ADMIN and EDITOR can enter dashboard
    if (userRole !== "ADMIN" && userRole !== "EDITOR") {
      if (isAdminApiRoute) {
        return NextResponse.json({ error: "Forbidden: Admin or Editor role required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin/login?error=AccessDenied", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
