import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(`/${session.user.role === "administrator" ? "administrator" : session.user.role === "admin" ? "admin" : session.user.role === "salesManager" ? "sales-manager" : session.user.role === "accountant" ? "accountant" : session.user.role === "finance" ? "finance" : "sales-dashboard"}`);
  }

  async function login(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    await signIn("credentials", { email, password, redirect: false });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Incentive.io</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        <form action={login} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </div>

          <Button type="submit" className="w-full">Sign in</Button>

          <p className="text-center text-sm">
            Don't have an account? <Link href="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}