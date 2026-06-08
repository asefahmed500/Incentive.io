import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"

  const callbackUrl = new URL(request.url).searchParams.get("callbackUrl") || "/login"

  const response = NextResponse.redirect(new URL(callbackUrl, request.url))

  response.cookies.set(cookieName, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  response.cookies.set("__Secure-next-auth.session-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  })

  response.cookies.set("next-auth.session-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  })

  response.cookies.set("__Secure-next-auth.callback-url", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  })

  response.cookies.set("next-auth.callback-url", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  })

  response.cookies.set("__Secure-next-auth.csrf-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  })

  response.cookies.set("next-auth.csrf-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  })

  return response
}
