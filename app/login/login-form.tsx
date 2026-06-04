"use client"

import { getSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotifications } from "@/hooks/useNotifications"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { showError } = useNotifications()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Client-side validation
    if (!email || !email.includes("@")) {
      showError(new Error("Please enter a valid email address"))
      setIsLoading(false)
      return
    }

    if (!password || password.length < 1) {
      showError(new Error("Please enter your password"))
      setIsLoading(false)
      return
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      showError(new Error(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error))
      setIsLoading(false)
    } else if (result?.ok) {
      let path = "/"
      try {
        const session = await getSession()
        const role = session?.user?.role
        path = role === "administrator" ? "/administrator"
          : role === "admin" ? "/admin"
          : role === "salesManager" ? "/sales-manager"
          : role === "accountant" ? "/accountant"
          : role === "finance" ? "/finance"
          : role === "salesExecutive" ? "/sales-dashboard"
          : "/"
      } catch (error) {
        console.error("Failed to fetch session after login:", error)
      }

      window.location.href = path
    }
  }

  return (
    <form onSubmit={login} className="mt-8 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isLoading}
            title="Please enter a valid email address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading}
              minLength={1}
              className="pr-10"
              title="Please enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div />
          <Link href="/reset-password" className="text-sm text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white" disabled={isLoading || !isHydrated}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
}
