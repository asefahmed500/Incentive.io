"use server"

import { redirect } from "next/navigation"

export async function logoutAction() {
  // Redirect to NextAuth signout endpoint which properly clears the JWT cookie
  redirect("/api/auth/signout?callbackUrl=/")
}
