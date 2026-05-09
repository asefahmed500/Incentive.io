import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(`/${session.user.role === "administrator" ? "administrator" : session.user.role === "admin" ? "admin" : session.user.role === "salesManager" ? "sales-manager" : session.user.role === "accountant" ? "accountant" : session.user.role === "finance" ? "finance" : "sales-dashboard"}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Incentive.io</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm">
          Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}