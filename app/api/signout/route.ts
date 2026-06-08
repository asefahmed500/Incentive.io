import { NextRequest, NextResponse } from "next/server"

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

function cookieHeader(name: string, secure: boolean) {
  const suffix = secure ? "; Secure" : ""
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${suffix}`
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url))

  for (const name of SESSION_NAMES) {
    response.headers.append("Set-Cookie", cookieHeader(name, false))
    response.headers.append("Set-Cookie", cookieHeader(name, true))
  }

  for (const name of OTHER_NAMES) {
    response.headers.append("Set-Cookie", cookieHeader(name, false))
    response.headers.append("Set-Cookie", cookieHeader(name, true))
  }

  return response
}
