import mongoose, { Schema, Document } from "mongoose";

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  category: "commission" | "user" | "system" | "notification";
  description?: string;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, enum: ["commission", "user", "system", "notification"], default: "system" },
  description: { type: String },
}, { timestamps: true });

export const SystemSettings = mongoose.models.SystemSettings || mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
