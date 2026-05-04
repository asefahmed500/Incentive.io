import mongoose, { Schema, Document } from "mongoose";

export interface ICategory {
  name: string;
  description: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

CategorySchema.index({ deletedAt: 1 });

CategorySchema.pre("find", function () {
  this.where({ deletedAt: null });
});
CategorySchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);