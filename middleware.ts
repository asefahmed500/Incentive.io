import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/api/health", "/api/socket"];

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (process.env.NODE_ENV === "production" && request.headers.get("x-forwarded-proto") !== "https") {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl);
  }

  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("next-auth.session-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secretStr = process.env.NEXTAUTH_SECRET;
    if (!secretStr) {
      throw new Error("NEXTAUTH_SECRET environment variable is not set");
    }
    const secret = new TextEncoder().encode(secretStr);
    const { payload } = await jwtVerify(token.value, secret);
    const userRole = payload.role as string;

    if (!userRole || userRole === "INVALID") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Role-based path access control
    const SUPER_PATHS = ["/admin", "/administrator", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];
    const ADMIN_PATHS = ["/admin", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];
    const MANAGER_PATHS = ["/sales-manager", "/sales-dashboard"];
    const EXECUTIVE_PATHS = ["/sales-dashboard"];
    const ACCOUNTANT_PATHS = ["/accountant", "/sales-dashboard"];
    const FINANCE_PATHS = ["/finance", "/sales-dashboard"];

    if (userRole === "administrator") {
      // Administrator has full access
      if (SUPER_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/administrator", request.url));
    }

    if (userRole === "admin") {
      // Admin blocked from administrator routes
      if (path.startsWith("/administrator")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (ADMIN_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (userRole === "salesManager") {
      // Sales Manager blocked from admin, accountant, finance routes
      const blockedPaths = ["/admin", "/administrator", "/accountant", "/finance"];
      if (blockedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL("/sales-manager", request.url));
      }
      if (MANAGER_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/sales-manager", request.url));
    }

    if (userRole === "salesExecutive") {
      // Sales Executive blocked from all other role routes
      const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/accountant", "/finance"];
      if (blockedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL("/sales-dashboard", request.url));
      }
      if (EXECUTIVE_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/sales-dashboard", request.url));
    }

    if (userRole === "accountant") {
      // Accountant blocked from admin, manager, finance routes
      const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/finance"];
      if (blockedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL("/accountant", request.url));
      }
      if (ACCOUNTANT_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/accountant", request.url));
    }

    if (userRole === "finance") {
      // Finance blocked from admin, manager, accountant routes
      const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/accountant"];
      if (blockedPaths.some(p => path.startsWith(p))) {
        return NextResponse.redirect(new URL("/finance", request.url));
      }
      if (FINANCE_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/finance", request.url));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

// Named export for testing purposes
export { default as middlewareHandler } from "./middleware";
