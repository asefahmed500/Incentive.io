"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const getProductsSchema = z.object({
  categoryId: objectIdSchema.optional(),
  search: z.string().optional(),
});

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  sku: z.string().min(1, "SKU is required").max(100),
  categoryId: objectIdSchema,
  price: z.number().min(0, "Price must be non-negative"),
  stock: z.number().int().min(0).optional(),
  image: z.string().max(500).optional(),
});

const updateProductSchema = z.object({
  id: objectIdSchema,
  name: z.string().min(1).max(200).optional(),
  sku: z.string().min(1).max(100).optional(),
  categoryId: objectIdSchema.optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().max(500).optional(),
});

const deleteProductSchema = objectIdSchema;

export async function getProducts({ categoryId, search }: { categoryId?: string; search?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = getProductsSchema.safeParse({ categoryId, search });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.categoryId) query.categoryId = parsed.data.categoryId;
  if (parsed.data.search) {
    query.$or = [
      { name: { $regex: parsed.data.search, $options: "i" } },
      { sku: { $regex: parsed.data.search, $options: "i" } },
    ];
  }

  const products = await Product.find(query).populate("categoryId", "name").lean();
  return products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    categoryId: (p.categoryId as unknown as { _id?: { toString: () => string } })?._id?.toString() || "",
    categoryName: (p.categoryId as unknown as { name?: string })?.name || "",
    price: p.price,
    stock: p.stock || 0,
    image: p.image || "",
    createdAt: p.createdAt,
  }));
}

export async function createProduct({
  name,
  sku,
  categoryId,
  price,
  stock,
  image,
}: {
  name: string;
  sku: string;
  categoryId: string;
  price: number;
  stock?: number;
  image?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = createProductSchema.safeParse({ name, sku, categoryId, price, stock, image });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const existing = await Product.findOne({ sku: parsed.data.sku });
  if (existing) return { error: "SKU already exists" };

  await Product.create({
    name: parsed.data.name,
    sku: parsed.data.sku,
    categoryId: parsed.data.categoryId,
    price: parsed.data.price,
    stock: parsed.data.stock ?? 0,
    image: parsed.data.image || "",
  });
  return { success: true };
}

export async function updateProduct({
  id,
  name,
  sku,
  categoryId,
  price,
  stock,
  image,
}: {
  id: string;
  name?: string;
  sku?: string;
  categoryId?: string;
  price?: number;
  stock?: number;
  image?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = updateProductSchema.safeParse({ id, name, sku, categoryId, price, stock, image });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.sku) updateData.sku = parsed.data.sku;
  if (parsed.data.categoryId) updateData.categoryId = parsed.data.categoryId;
  if (parsed.data.price !== undefined) updateData.price = parsed.data.price;
  if (parsed.data.stock !== undefined) updateData.stock = parsed.data.stock;
  if (parsed.data.image !== undefined) updateData.image = parsed.data.image;
  await Product.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = deleteProductSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Product.findByIdAndUpdate(parsed.data, { deletedAt: new Date() });
  return { success: true };
}