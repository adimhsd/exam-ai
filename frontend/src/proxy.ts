import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isStudentPortal = pathname === "/submit";

  // Ignore static assets, favicon, API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 1. If not logged in and trying to access private admin pages -> Redirect to /login
  if (!token && !isLoginPage && !isStudentPortal) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. If logged in and trying to access /login -> Redirect to appropriate landing page
  if (token && isLoginPage) {
    if (role === "admin" || role === "dosen") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  // 3. If logged in but is NOT Dosen/Admin, and trying to access admin pages -> Redirect to /submit
  if (token && !isLoginPage && !isStudentPortal && role !== "admin" && role !== "dosen") {
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
