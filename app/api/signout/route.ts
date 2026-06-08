import { NextRequest, NextResponse } from "next/server"

const COOKIE_BASE = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  const names = ["next-auth.session-token", "__Secure-next-auth.session-token"]

  for (const name of names) {
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: false })
    response.cookies.set(name, "", { ...COOKIE_BASE, maxAge: 0, secure: true })
  }

  response.cookies.set("__Secure-next-auth.callback-url", "", {
    ...COOKIE_BASE, maxAge: 0, secure: true,
  })
  response.cookies.set("next-auth.callback-url", "", {
    ...COOKIE_BASE, maxAge: 0, secure: false,
  })
  response.cookies.set("__Secure-next-auth.csrf-token", "", {
    ...COOKIE_BASE, maxAge: 0, secure: true,
  })
  response.cookies.set("next-auth.csrf-token", "", {
    ...COOKIE_BASE, maxAge: 0, secure: false,
  })

  return response
}
