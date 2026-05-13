"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Check, X } from "lucide-react";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Password requirements
  const requirements = [
    { label: "At least 12 characters", test: (pwd: string) => pwd.length >= 12 },
    { label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: "One number", test: (pwd: string) => /[0-9]/.test(pwd) },
    { label: "One special character", test: (pwd: string) => /[^A-Za-z0-9]/.test(pwd) },
  ];

  const allRequirementsMet = requirements.every(req => req.test(password));

  async function register(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const data = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          phone: (formData.get("phone") as string) || "",
        };

        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          // Parse validation errors for better display
          if (result.details && Array.isArray(result.details)) {
            const errorMessages = result.details.map((d: any) => d.message).join(". ");
            setError(errorMessages || result.error || "Registration failed. Please try again.");
          } else {
            setError(result.error || "Registration failed. Please try again.");
          }
          return;
        }

        router.push("/login?registered=true");
      } catch (err) {
        setError("An error occurred. Please try again.");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Incentive.io</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your name"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              required
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordTouched(true)}
              onBlur={() => setPasswordTouched(false)}
            />
            {passwordTouched && password && (
              <div className="mt-2 space-y-1 rounded-md border p-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
                {requirements.map((req, index) => {
                  const meets = req.test(password);
                  return (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {meets ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-red-600" />
                      )}
                      <span className={meets ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || Boolean(password && !allRequirementsMet)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          By registering, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
