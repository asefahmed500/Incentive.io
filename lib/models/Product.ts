import mongoose, { Schema, Document } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  categoryId: mongoose.Types.ObjectId;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);