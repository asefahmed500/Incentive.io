import mongoose, { Schema, Document } from "mongoose";

export interface ISalesRecord extends Document {
  employeeId: string;
  employeeName: string;
  companyName: string;
  companyEmail: string;
  products: {
    productName: string;
    categoryId: mongoose.Types.ObjectId;
    unitPrice: number;
    quantity: number;
    originalPrice?: number;
    dealNotes?: string;
  }[];
  taxEnabled: boolean;
  vatEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  vatRate: number;
  vatAmount: number;
  eoBpAmount: number;
  eoBpReason?: string;
  netSales: number;
  status: "Draft" | "Pending_Manager" | "Pending_Accountant" | "Pending_Finance" | "Approved" | "Rejected";
  approvalStatus: "Pending" | "Approved" | "Rejected";
  accountantStatus: "Pending" | "Approved" | "Rejected";
  financeStatus: "Pending" | "Approved" | "Rejected";
  commission: number;
  calculatedCommission: number;
  rejectionReason?: string;
  proofOfSale: string[];
  managerId: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  processedAt?: Date;
  finalApprovedAt?: Date;
  isPaid: boolean;
  paymentStatus: "Pending" | "Paid";
  paymentDate?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SalesRecordSchema = new Schema<ISalesRecord>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    companyName: { type: String, required: true },
    companyEmail: { type: String, required: true, lowercase: true },
    products: [
      {
        productName: { type: String, required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        originalPrice: { type: Number },
        dealNotes: { type: String },
      },
    ],
    taxEnabled: { type: Boolean, default: false },
    vatEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    vatRate: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    eoBpAmount: { type: Number, default: 0 },
    eoBpReason: { type: String },
    netSales: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Pending_Manager", "Pending_Accountant", "Pending_Finance", "Approved", "Rejected"],
      default: "Draft",
    },
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    accountantStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    financeStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    commission: { type: Number, default: 0 },
    calculatedCommission: { type: Number, default: 0 },
    rejectionReason: { type: String },
    proofOfSale: [String],
    managerId: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    processedAt: { type: Date },
    finalApprovedAt: { type: Date },
    isPaid: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
    paymentDate: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

SalesRecordSchema.index({ employeeId: 1 });
SalesRecordSchema.index({ companyName: 1 });
SalesRecordSchema.index({ status: 1 });
SalesRecordSchema.index({ managerId: 1 });
SalesRecordSchema.index({ financeStatus: 1, employeeId: 1 });
SalesRecordSchema.index({ isPaid: 1 });
SalesRecordSchema.index({ deletedAt: 1 });
SalesRecordSchema.index({ createdAt: -1 });

SalesRecordSchema.pre("find", function () {
  this.where({ deletedAt: null });
});
SalesRecordSchema.pre("findOne", function () {
  this.where({ deletedAt: null });
});

export const SalesRecord = mongoose.models.SalesRecord || mongoose.model<ISalesRecord>("SalesRecord", SalesRecordSchema);