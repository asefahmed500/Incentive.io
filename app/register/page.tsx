import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(`/${session.user.role === "administrator" ? "administrator" : session.user.role === "admin" ? "admin" : session.user.role === "salesManager" ? "sales-manager" : session.user.role === "accountant" ? "accountant" : session.user.role === "finance" ? "finance" : "sales-dashboard"}`);
  }

  async function register(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const email = (formData.get("email") as string).toLowerCase();
    const password = formData.get("password") as string;
    const phone = (formData.get("phone") as string) || "";

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "salesExecutive",
      isActive: true,
      targetAmount: 0,
    });

    redirect("/login?registered=true");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Incentive.io</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>
        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" type="text" placeholder="Enter your name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="Enter your email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Create a password" required minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input id="phone" name="phone" type="tel" placeholder="Enter your phone" />
          </div>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
