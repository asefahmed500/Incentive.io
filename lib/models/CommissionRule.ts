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
  },
  { timestamps: true }
);

const CommissionRule = mongoose.models.CommissionRule || mongoose.model<ICommissionRule>("CommissionRule", CommissionRuleSchema);
export default CommissionRule;
