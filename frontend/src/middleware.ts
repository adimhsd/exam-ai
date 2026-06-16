import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value;
  
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isStudentPortal = pathname === "/submit" || pathname === "/submit-success";
  const isRootPage = pathname === "/";

  // Ignore static assets, favicon, API routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  // 1. Jika mengakses root "/" dan belum login -> arahkan ke /submit (portal mahasiswa)
  if (isRootPage && !token) {
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  // 2. Jika belum login dan mencoba akses halaman admin -> arahkan ke /login
  if (!token && !isLoginPage && !isStudentPortal) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Jika sudah login dan mencoba akses /login -> arahkan ke halaman yang sesuai
  if (token && isLoginPage) {
    if (role === "admin" || role === "dosen") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  // 4. Jika sudah login tapi bukan Dosen/Admin, mencoba akses halaman admin -> arahkan ke /submit
  if (token && !isLoginPage && !isStudentPortal && role !== "admin" && role !== "dosen") {
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
