"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/lib/models/Category";
import type { ICategory } from "@/lib/models/Category";

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
  await connectToDatabase();
  const existing = await Category.findOne({ name });
  if (existing) return { error: "Category already exists" };
  
  const category = await Category.create({ name, description });
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
  await connectToDatabase();
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  await Category.findByIdAndUpdate(id, updateData);
  return { success: true };
}

export async function deleteCategory(id: string) {
  await connectToDatabase();
  await Category.findByIdAndDelete(id);
  return { success: true };
}
