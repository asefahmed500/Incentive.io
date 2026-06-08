import { NextRequest, NextResponse } from "next/server"

const COOKIE_BASE = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
}

const SESSION_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
]

const OTHER_NAMES = [
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
  "next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
  "authjs.csrf-token",
  "__Secure-authjs.csrf-token",
]

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  for (const name of SESSION_NAMES) {
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: false })
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: true })
  }

  for (const name of OTHER_NAMES) {
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: false })
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: true })
  }

  return response
}
