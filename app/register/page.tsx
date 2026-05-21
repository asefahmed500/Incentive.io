import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { RegisterForm } from "./register-form";
import { AuthBackground } from "@/components/home/auth-background";

export default async function RegisterPage() {
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
      <RegisterForm />
    </AuthBackground>
  );
}
