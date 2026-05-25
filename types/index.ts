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
  categoryId: string; // Client-facing: ObjectId serialized to string via .toString()
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
  autoApproved: boolean;
  autoApprovedAt?: Date;
  autoApprovedCategories: string[];
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
  previousTargetAmount?: number;
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
  autoApprove: boolean;
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
  recipientRole: UserRole;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Standardized server action result types
 * These provide consistent return types across all server actions
 */

/**
 * Base success result with optional data
 */
export interface ActionSuccess<T = unknown> {
  success: true
  data?: T
  id?: string
}

/**
 * Error result with message and optional code
 */
export interface ActionError {
  success: false
  error: string
  code?: string
  statusCode?: number
}

/**
 * Discriminated union for action results
 * Use this for all server actions that can return data or errors
 */
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionError

/**
 * Server action return type - extends ActionResult with undefined support
 * This is the primary type to use for server action return types
 */
export type ServerActionResult<T = unknown> = ActionResult<T> | undefined

/**
 * Action result with ID (for create operations)
 */
export type ActionResultWithId<T = unknown> = (ActionSuccess<T> & { id: string }) | ActionError

/**
 * List action result for operations returning arrays
 */
export type ListResult<T = unknown> = ActionResult<T[]>

/**
 * Paginated action result
 */
export interface PaginatedResult<T = unknown> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PaginatedActionResult<T = unknown> = ActionResult<PaginatedResult<T>>

/**
 * Legacy API response types (for backward compatibility)
 * @deprecated Use ActionResult instead for new code
 */
export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number
  page?: number
  pageSize?: number
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
