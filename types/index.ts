/**
 * Type definitions for Incentive.io
 * These types provide type safety across the application
 */

export type UserRole =
  | "admin"
  | "administrator"
  | "salesManager"
  | "salesExecutive"
  | "accountant"
  | "finance";

export type SaleStatus =
  | "Draft"
  | "Pending_Manager"
  | "Pending_Accountant"
  | "Pending_Finance"
  | "Approved"
  | "Rejected";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export type TransactionType = "credit" | "debit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  isActive?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface SaleProduct {
  productName: string;
  categoryId: string;
  unitPrice: number;
  quantity: number;
  originalPrice?: number;
  dealNotes?: string;
}

export interface SaleRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  companyName: string;
  companyEmail: string;
  products: SaleProduct[];
  taxEnabled: boolean;
  vatEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  vatRate: number;
  vatAmount: number;
  eoBpAmount: number;
  eoBpReason?: string;
  netSales: number;
  status: SaleStatus;
  approvalStatus: ApprovalStatus;
  accountantStatus: ApprovalStatus;
  financeStatus: ApprovalStatus;
  commission: number;
  calculatedCommission: number;
  rejectionReason?: string;
  rejectedBy?: "manager" | "accountant" | "finance";
  eligibilityStatus?: "Eligible" | "Not_Eligible" | "Pending";
  proofOfSale: string[];
  managerId: string;
  approvedBy?: string;
  approvedAt?: Date;
  processedAt?: Date;
  finalApprovedAt?: Date;
  paidBy?: string;
  isPaid: boolean;
  paymentStatus: "Pending" | "Paid";
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleRecordCreateInput {
  employeeId?: string;
  employeeName: string;
  companyName: string;
  companyEmail: string;
  products: SaleProduct[];
  taxEnabled: boolean;
  vatEnabled: boolean;
  proofOfSale?: string[];
}

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  salesRecordId?: string;
  description: string;
  balanceAfter: number;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  employeeId: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalPaid: number;
  transactions: WalletTransaction[];
}

export interface CommissionRule {
  id: string;
  targetPercentageFrom: number;
  targetPercentageTo: number;
  commissionRate: number;
  categoryId?: string;
  priority: number;
  isActive: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
  phone: string;
  isActive: boolean;
  isEligible: boolean;
  teamId?: string;
  managerId?: string;
  targetAmount: number;
  targetPeriod?: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string;
  memberCount: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  price: number;
  stock: number;
  image: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface SalesStats {
  total: number;
  draft: number;
  pendingManager: number;
  pendingAccountant: number;
  pendingFinance: number;
  approved: number;
  rejected: number;
  totalAmount: number;
  totalCommission: number;
  approvedToday: number;
  processedToday: number;
  pendingPayments: number;
  totalDeductions: number;
}

export interface CommissionCalculationParams {
  employeeId: string;
  grossAmount: number;
  netSales: number;
  targetAmount: number;
  achievement: number;
}

export interface EligibilityInfo {
  eligible: boolean;
  achievement: number;
  totalSales?: number;
  targetAmount?: number;
  message: string;
}
