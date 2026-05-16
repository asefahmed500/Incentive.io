import mongoose, { Schema, Document } from "mongoose";

export interface IWallet extends Document {
  employeeId: mongoose.Types.ObjectId;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  transactions: {
    type: "credit" | "debit";
    amount: number;
    salesRecordId?: mongoose.Types.ObjectId;
    description: string;
    balanceAfter: number;
    createdAt: Date;
  }[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema({
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true, min: 0 },
  salesRecordId: { type: Schema.Types.ObjectId, ref: "SalesRecord" },
  description: { type: String, required: true },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const WalletSchema = new Schema<IWallet>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    pendingBalance: { type: Number, default: 0, min: 0 },
    totalEarned: { type: Number, default: 0, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    transactions: [WalletTransactionSchema],
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Performance optimization: compound indexes for wallet queries
WalletSchema.index({ deletedAt: 1 });
// Note: employeeId already has a unique index, no need to duplicate
WalletSchema.index({ employeeId: 1, balance: 1 });
WalletSchema.index({ balance: 1 });
WalletSchema.index({ "transactions.createdAt": -1 });

// Soft delete hooks
WalletSchema.pre("find", function() {
  this.where({ deletedAt: null });
});
WalletSchema.pre("findOne", function() {
  this.where({ deletedAt: null });
});

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);
