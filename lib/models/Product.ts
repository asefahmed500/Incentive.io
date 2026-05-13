import mongoose, { Schema, Document } from "mongoose";

export interface IProduct {
  name: string;
  sku: string;
  categoryId: mongoose.Types.ObjectId;
  price: number;
  stock: number;
  image?: string;
  deletedAt?: Date;
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
    image: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

ProductSchema.index({ deletedAt: 1 });
ProductSchema.index({ categoryId: 1 });

ProductSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
ProductSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);