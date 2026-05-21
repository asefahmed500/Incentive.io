import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { AuthBackground } from "@/components/home/auth-background";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const roleRedirects: Record<string, string> = {
      administrator: "administrator",
      admin: "admin",
      salesManager: "sales-manager",
      accountant: "accountant",
      finance: "finance",
      salesExecutive: "sales-dashboard",
    };
    const redirectPath = roleRedirects[session.user.role] || "sales-dashboard";
    redirect(`/${redirectPath}`);
  }

  return (
    <AuthBackground>
      <div className="w-full max-w-md mx-4">
        <div className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-sky-100 dark:border-sky-900/50 p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Incentive.io
            </h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <LoginForm />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}