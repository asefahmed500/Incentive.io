import { auth } from "@/lib/auth/auth";

type Role = "admin" | "administrator" | "salesManager" | "salesExecutive" | "accountant" | "finance";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  return { session } as const;
}

export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 } as const;
  }
  const userRole = (session.user as any).role as string;
  if (!roles.includes(userRole as Role)) {
    return { error: "Forbidden: Insufficient permissions", status: 403 } as const;
  }
  return { session } as const;
}

export async function requireAdminOrAbove() {
  return requireRole("admin", "administrator");
}

export async function requireManagerOrAbove() {
  return requireRole("admin", "administrator", "salesManager");
}

export async function requireFinanceOrAbove() {
  return requireRole("admin", "administrator", "finance");
}

export async function requireAccountantOrAbove() {
  return requireRole("admin", "administrator", "accountant", "finance");
}