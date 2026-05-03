"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";

export async function getProducts({ categoryId, search }: { categoryId?: string; search?: string }) {
  await connectToDatabase();
  
  const query: any = {};
  if (categoryId) query.categoryId = categoryId;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];
  }
  
  const products = await Product.find(query).populate("categoryId", "name").lean();
  return products.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    categoryId: (p.categoryId as any)?._id?.toString() || "",
    categoryName: (p.categoryId as any)?.name || "",
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
  await connectToDatabase();
  const existing = await Product.findOne({ sku });
  if (existing) return { error: "SKU already exists" };
  
  await Product.create({ name, sku, categoryId, price, stock, image });
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
  await connectToDatabase();
  const updateData: any = {};
  if (name) updateData.name = name;
  if (sku) updateData.sku = sku;
  if (categoryId) updateData.categoryId = categoryId;
  if (price !== undefined) updateData.price = price;
  if (stock !== undefined) updateData.stock = stock;
  if (image !== undefined) updateData.image = image;
  await Product.findByIdAndUpdate(id, updateData);
  return { success: true };
}

export async function deleteProduct(id: string) {
  await connectToDatabase();
  await Product.findByIdAndDelete(id);
  return { success: true };
}
