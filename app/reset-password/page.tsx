"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNotifications } from "@/hooks/useNotifications"
import { AuthBackground } from "@/components/home/auth-background"
import Link from "next/link"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  const { showSuccess, showError } = useNotifications()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      showError(new Error("Please enter a valid email"))
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        showError(new Error(data.error))
      } else {
        setSent(true)
        showSuccess("If an account exists with this email, a reset link has been sent.")
      }
    } catch {
      showError(new Error("Failed to send reset request. Try again."))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password || password.length < 12) {
      showError(new Error("Password must be at least 12 characters"))
      return
    }
    if (password !== confirmPassword) {
      showError(new Error("Passwords do not match"))
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (data.error) {
        showError(new Error(data.error))
      } else {
        showSuccess("Password reset successfully! Redirecting to login...")
        setTimeout(() => router.push("/login"), 2000)
      }
    } catch {
      showError(new Error("Failed to reset password. Try again."))
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold">Check Your Email</h2>
        <p className="text-muted-foreground">If an account exists with that email, we&apos;ve sent a password reset link. Check your inbox and spam folder.</p>
        <Link href="/login" className="text-sky-600 hover:underline font-medium">Back to Login</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-4">
      <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-sky-100 dark:border-sky-900/50 p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            {token ? "Reset Password" : "Forgot Password"}
          </h1>
          <p className="text-muted-foreground">
            {token ? "Enter your new password below" : "Enter your email to receive a reset link"}
          </p>
        </div>

        {token ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} placeholder="At least 12 characters" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isLoading} placeholder="Repeat new password" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} placeholder="you@example.com" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthBackground>
      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </AuthBackground>
  )
}
