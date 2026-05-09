import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
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
  deletedAt?: Date;
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
    previousTargetAmount: { type: Number },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// email and employeeId indexes are auto-created by unique/sparse in schema definition
UserSchema.index({ role: 1 });
UserSchema.index({ managerId: 1 });
UserSchema.index({ teamId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ deletedAt: 1 });
// Performance optimization: compound indexes for user queries
UserSchema.index({ isEligible: 1, targetAmount: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ managerId: 1, isActive: 1 });

UserSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
UserSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);