import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const base64Url = token.value.split(".")[1];
    if (!base64Url) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
    const userRole = payload.role;

    if (!userRole) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const ADMIN_PATHS = ["/admin", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];
    const SUPER_PATHS = ["/admin", "/administrator", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"];

    if (userRole === "administrator") {
      if (SUPER_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/administrator", request.url));
    }

    if (userRole === "admin") {
      if (path.startsWith("/administrator")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (ADMIN_PATHS.some(p => path.startsWith(p))) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (userRole === "salesManager") {
      if (path.startsWith("/sales-manager") || path.startsWith("/sales-dashboard")) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/sales-manager", request.url));
    }

    if (userRole === "salesExecutive") {
      if (path.startsWith("/sales-dashboard")) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/sales-dashboard", request.url));
    }

    if (userRole === "accountant") {
      if (path.startsWith("/accountant") || path.startsWith("/sales-dashboard")) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/accountant", request.url));
    }

    if (userRole === "finance") {
      if (path.startsWith("/finance") || path.startsWith("/sales-dashboard")) {
        return NextResponse.next();
      }
      if (path.startsWith("/api/")) {
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