import mongoose, { Schema, Document } from "mongoose";

export interface ICommissionRule extends Document {
  targetPercentageFrom: number;
  targetPercentageTo: number;
  commissionRate: number;
  categoryId?: mongoose.Types.ObjectId;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRuleSchema = new Schema<ICommissionRule>(
  {
    targetPercentageFrom: { type: Number, required: true },
    targetPercentageTo: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date },
    validTo: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

CommissionRuleSchema.index({ isActive: 1, priority: -1 });
CommissionRuleSchema.index({ categoryId: 1 });
CommissionRuleSchema.index({ targetPercentageFrom: 1, targetPercentageTo: 1 });
CommissionRuleSchema.index({ targetPercentageTo: 1, targetPercentageFrom: -1 });

// Soft delete hooks - auto-filter deleted records
CommissionRuleSchema.pre("find", function() {
  this.where({ deletedAt: null });
});

CommissionRuleSchema.pre("findOne", function() {
  this.where({ deletedAt: null });
});

CommissionRuleSchema.pre("countDocuments", function() {
  this.where({ deletedAt: null });
});

// Validation hook for percentage ranges and commission rate
CommissionRuleSchema.pre("save", function() {
  if (this.targetPercentageFrom > this.targetPercentageTo) {
    throw new Error("targetPercentageFrom must be less than or equal to targetPercentageTo");
  }
  if (this.commissionRate < 0 || this.commissionRate > 100) {
    throw new Error("commissionRate must be between 0 and 100");
  }
});

export const CommissionRule = mongoose.models.CommissionRule || mongoose.model<ICommissionRule>("CommissionRule", CommissionRuleSchema);