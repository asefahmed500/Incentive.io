import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkDatabaseConnection } from "@/lib/mongodb";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth", "/api/health", "/api/socket"];

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin"],
  administrator: ["/administrator"],
  salesExecutive: ["/sales-dashboard"],
  salesManager: ["/sales-manager"],
  accountant: ["/accountant"],
  finance: ["/finance"],
};

export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }
  
  try {
    const dbCheck = await checkDatabaseConnection();
    if (!dbCheck.connected) {
      console.warn("Database not connected, allowing request through");
    }
  } catch (error) {
    console.warn("Database check failed:", error);
  }
  
  const token = request.cookies.get("next-auth.session-token");
  
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  const role = request.cookies.get("next-auth.session-token");
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { auth } = await import("@/lib/auth/auth");
      const session = await auth();
      if (session?.user?.role) {
        const userRole = (session.user as any).role as string;
        const allowedRoutes = ROLE_ROUTES[userRole] || [];
        if (allowedRoutes.some(route => path.startsWith(route))) {
          return NextResponse.next();
        }
        if (userRole === "administrator" && (path.startsWith("/admin") || path.startsWith("/sales") || path.startsWith("/accountant") || path.startsWith("/finance"))) {
          return NextResponse.next();
        }
        if (userRole === "admin" && (path.startsWith("/admin") || path.startsWith("/sales") || path.startsWith("/accountant") || path.startsWith("/finance"))) {
          return NextResponse.next();
        }
      }
    } catch {
    }
  }
  
  const sessionCookie = request.cookies.get("next-auth.session-token");
  if (sessionCookie) {
    try {
      const base64Url = sessionCookie.value.split(".")[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
        const userRole = payload.role;
        
        if (userRole) {
          const allowedRoutes = ROLE_ROUTES[userRole] || [];
          if (allowedRoutes.some(route => path.startsWith(route))) {
            return NextResponse.next();
          }
          
          if (userRole === "administrator" && (
            path.startsWith("/admin") ||
            path.startsWith("/sales-dashboard") ||
            path.startsWith("/sales-manager") ||
            path.startsWith("/accountant") ||
            path.startsWith("/finance")
          )) {
            return NextResponse.next();
          }
          
          if (userRole === "admin" && !path.startsWith("/administrator") && (
            path.startsWith("/admin") ||
            path.startsWith("/sales-dashboard") ||
            path.startsWith("/sales-manager") ||
            path.startsWith("/accountant") ||
            path.startsWith("/finance")
          )) {
            return NextResponse.next();
          }
          
          if (userRole === "salesManager" && (
            path.startsWith("/sales-manager") ||
            path.startsWith("/sales-dashboard")
          )) {
            return NextResponse.next();
          }
          
          if (userRole === "salesExecutive" && path.startsWith("/sales-dashboard")) {
            return NextResponse.next();
          }
          
          if (userRole === "accountant" && (
            path.startsWith("/accountant") ||
            path.startsWith("/sales-dashboard")
          )) {
            return NextResponse.next();
          }
          
          if (userRole === "finance" && (
            path.startsWith("/finance") ||
            path.startsWith("/sales-dashboard")
          )) {
            return NextResponse.next();
          }
          
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    } catch (e) {
      console.error("Role check failed:", e);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
