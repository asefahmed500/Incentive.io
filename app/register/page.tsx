import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(`/${session.user.role === "administrator" ? "administrator" : session.user.role === "admin" ? "admin" : session.user.role === "salesManager" ? "sales-manager" : session.user.role === "accountant" ? "accountant" : session.user.role === "finance" ? "finance" : "sales-dashboard"}`);
  }

  return <RegisterForm />;
}
