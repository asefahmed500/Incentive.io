"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import type { ICategory } from "@/lib/models/Category";
import type { AuthUser, UserRole } from "@/types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(200),
  description: z.string().max(500).optional(),
  autoApprove: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  id: objectIdSchema,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  autoApprove: z.boolean().optional(),
});

const deleteCategorySchema = objectIdSchema;

export async function getCategories(): Promise<ICategory[]> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" } as unknown as ICategory[];
  await connectToDatabase();
  const categories = await Category.find().lean();
  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    autoApprove: c.autoApprove || false,
    createdAt: c.createdAt,
  })) as unknown as ICategory[];
}

export async function createCategory({
  name,
  description,
  autoApprove,
}: {
  name: string;
  description?: string;
  autoApprove?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = createCategorySchema.safeParse({ name, description, autoApprove });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const existing = await Category.findOne({ name: parsed.data.name });
  if (existing) return { error: "Category already exists" };

  const category = await Category.create({
    name: parsed.data.name,
    description: parsed.data.description,
    autoApprove: parsed.data.autoApprove || false,
  });
  return { success: true, id: category._id.toString() };
}

export async function updateCategory({
  id,
  name,
  description,
  autoApprove,
}: {
  id: string;
  name?: string;
  description?: string;
  autoApprove?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = updateCategorySchema.safeParse({ id, name, description, autoApprove });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.autoApprove !== undefined) updateData.autoApprove = parsed.data.autoApprove;
  await Category.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = deleteCategorySchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();

  const categoryId = parsed.data;

  // Check if category has products
  const productCount = await Product.countDocuments({ categoryId, deletedAt: null });
  if (productCount > 0) {
    return { error: `Cannot delete category with ${productCount} products. Please reassign or delete the products first.` };
  }

  // Safe to delete the category
  await Category.findByIdAndUpdate(categoryId, { deletedAt: new Date() });
  return { success: true };
}

export async function getAutoApproveCategories(): Promise<ICategory[]> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" } as unknown as ICategory[];
  await connectToDatabase();
  const categories = await Category.find({ autoApprove: true }).lean();
  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    autoApprove: c.autoApprove || false,
    createdAt: c.createdAt,
  })) as unknown as ICategory[];
}

const toggleAutoApproveSchema = z.object({
  id: objectIdSchema,
  autoApprove: z.boolean(),
});

export async function toggleCategoryAutoApprove({
  id,
  autoApprove,
}: {
  id: string;
  autoApprove: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };

  const parsed = toggleAutoApproveSchema.safeParse({ id, autoApprove });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await connectToDatabase();

  // Get current category state for audit logging
  const category = await Category.findById(parsed.data.id);
  if (!category) return { error: "Category not found" };

  const previousValue = category.autoApprove;

  // Update the category
  await Category.findByIdAndUpdate(parsed.data.id, { autoApprove: parsed.data.autoApprove });

  // Audit log the change
  const { logAudit } = await import("@/lib/actions/audit.actions");
  await logAudit({
    userId: session.user.id,
    userRole,
    action: "CATEGORY_AUTO_APPROVE_TOGGLED",
    entity: "Category",
    entityId: parsed.data.id,
    details: {
      categoryName: category.name,
      autoApprove: parsed.data.autoApprove,
      previousValue,
    },
  });

  return { success: true, autoApprove: parsed.data.autoApprove };
}