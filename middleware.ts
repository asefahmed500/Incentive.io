import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/api/health", "/api/socket"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role as string;

  // Handle HTTPS redirect in production
  if (process.env.NODE_ENV === "production" && req.headers.get("x-forwarded-proto") !== "https") {
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl);
  }

  // Allow public paths
  const isPublicPath = path === "/" || PUBLIC_PATHS.filter(p => p !== "/").some(p => path.startsWith(p));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Validate role
  if (!userRole || userRole === "INVALID") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based path access control
  const SUPER_PATHS = ["/admin", "/administrator", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];
  const ADMIN_PATHS = ["/admin", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];
  const MANAGER_PATHS = ["/sales-manager", "/sales-dashboard"];
  const EXECUTIVE_PATHS = ["/sales-dashboard"];
  const ACCOUNTANT_PATHS = ["/accountant", "/sales-dashboard"];
  const FINANCE_PATHS = ["/finance", "/sales-dashboard"];

  if (userRole === "administrator") {
    if (SUPER_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/administrator", req.url));
  }

  if (userRole === "admin") {
    if (path.startsWith("/administrator")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (ADMIN_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (userRole === "salesManager") {
    const blockedPaths = ["/admin", "/administrator", "/accountant", "/finance"];
    if (blockedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/sales-manager", req.url));
    }
    if (MANAGER_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sales-manager", req.url));
  }

  if (userRole === "salesExecutive") {
    const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/accountant", "/finance"];
    if (blockedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/sales-dashboard", req.url));
    }
    if (EXECUTIVE_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sales-dashboard", req.url));
  }

  if (userRole === "accountant") {
    const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/finance"];
    if (blockedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/accountant", req.url));
    }
    if (ACCOUNTANT_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/accountant", req.url));
  }

  if (userRole === "finance") {
    const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/accountant"];
    if (blockedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/finance", req.url));
    }
    if (FINANCE_PATHS.some(p => path.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/finance", req.url));
  }

  return NextResponse.redirect(new URL("/login", req.url));
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
