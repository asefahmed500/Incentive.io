"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import type { ICategory } from "@/lib/models/Category";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(200),
  description: z.string().max(500).optional(),
});

const updateCategorySchema = z.object({
  id: objectIdSchema,
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
});

const deleteCategorySchema = objectIdSchema;

export async function getCategories(): Promise<ICategory[]> {
  await connectToDatabase();
  const categories = await Category.find().lean();
  return categories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    createdAt: c.createdAt,
  })) as unknown as ICategory[];
}

export async function createCategory({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  const parsed = createCategorySchema.safeParse({ name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const existing = await Category.findOne({ name: parsed.data.name });
  if (existing) return { error: "Category already exists" };

  const category = await Category.create({
    name: parsed.data.name,
    description: parsed.data.description,
  });
  return { success: true, id: category._id.toString() };
}

export async function updateCategory({
  id,
  name,
  description,
}: {
  id: string;
  name?: string;
  description?: string;
}) {
  const parsed = updateCategorySchema.safeParse({ id, name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  await Category.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteCategory(id: string) {
  const parsed = deleteCategorySchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Category.findByIdAndDelete(parsed.data);
  return { success: true };
}