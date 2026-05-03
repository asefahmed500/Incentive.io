import mongoose, { Schema, Document } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "admin" | "administrator" | "salesManager" | "salesExecutive" | "accountant" | "finance";
  employeeId: string;
  phone: string;
  isActive: boolean;
  isEligible: boolean;
  teamId?: mongoose.Types.ObjectId;
  managerId?: mongoose.Types.ObjectId;
  targetAmount: number;
  targetPeriod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "administrator", "salesManager", "salesExecutive", "accountant", "finance"],
      default: "salesExecutive",
    },
    employeeId: { type: String, unique: true, sparse: true },
    phone: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    isEligible: { type: Boolean, default: false },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    targetAmount: { type: Number, default: 0 },
    targetPeriod: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);