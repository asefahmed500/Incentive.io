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
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema({
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  salesRecordId: { type: Schema.Types.ObjectId, ref: "SalesRecord" },
  description: { type: String, required: true },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const WalletSchema = new Schema<IWallet>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    transactions: [WalletTransactionSchema],
  },
  { timestamps: true }
);

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", WalletSchema);
