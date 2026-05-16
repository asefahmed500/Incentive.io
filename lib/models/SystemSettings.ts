import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  category: "commission" | "user" | "system" | "notification";
  description?: string;
  deletedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, enum: ["commission", "user", "system", "notification"], default: "system" },
  description: { type: String },
  deletedAt: { type: Date },
}, { timestamps: true });

// Performance indexes for settings lookups
// Note: key field already has unique: true in schema definition
SystemSettingsSchema.index({ category: 1 });
SystemSettingsSchema.index({ deletedAt: 1 });

// Soft delete hooks
SystemSettingsSchema.pre("find", function() {
  this.where({ deletedAt: null });
});
SystemSettingsSchema.pre("findOne", function() {
  this.where({ deletedAt: null });
});

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
