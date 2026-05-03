import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import CommissionRule from "@/lib/models/CommissionRule";
import { Wallet } from "@/lib/models/Wallet";

async function syncCommissions() {
  const records = await SalesRecord.find({
    approvalStatus: "Approved",
    accountantStatus: "Approved",
    financeStatus: "Approved",
  }).populate("employeeId", "targetAmount").lean();
  
  let updated = 0;
  for (const record of records) {
    const employee = (record.employeeId as any);
    if (!employee?.targetAmount) continue;
    
    const recordAmount = record.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0);
    const achievement = (recordAmount / employee.targetAmount) * 100;
    
    const rule = await CommissionRule.findOne({
      targetPercentageFrom: { $lte: achievement },
      targetPercentageTo: { $gte: achievement },
      isActive: true,
    }).sort({ priority: -1 });
    
    if (rule) {
      const commission = (recordAmount * rule.commissionRate) / 100;
      if (record.calculatedCommission !== commission) {
        await SalesRecord.findByIdAndUpdate(record._id, {
          calculatedCommission: commission,
          commission: commission,
        });
        updated++;
      }
    }
  }
  return updated;
}

async function syncTargets() {
  const users = await User.find({ targetAmount: { $gt: 0 } }).lean();
  let synced = 0;
  for (const user of users) {
    const hasRecords = await SalesRecord.findOne({
      employeeId: user._id.toString(),
      financeStatus: "Approved",
    });
    if (!hasRecords) {
      await User.findByIdAndUpdate(user._id, { targetPeriod: user.targetPeriod || "monthly" });
      synced++;
    }
  }
  return synced;
}

async function syncTeams() {
  const users = await User.find({ role: "salesExecutive" }).lean();
  let synced = 0;
  for (const user of users) {
    if (user.managerId) {
      const manager = await User.findById(user.managerId);
      if (manager && manager.role !== "salesManager") {
        await User.findByIdAndUpdate(user._id, { managerId: null });
        synced++;
      }
    }
  }
  return synced;
}

async function syncWallets() {
  const wallets = await Wallet.find().lean();
  let reconciled = 0;
  for (const wallet of wallets) {
    const computedBalance = wallet.transactions.reduce((sum: number, t: any) => {
      return sum + (t.type === "credit" ? t.amount : -t.amount);
    }, 0);
    
    if (Math.abs(wallet.balance - computedBalance) > 0.01) {
      await Wallet.findByIdAndUpdate(wallet._id, { balance: computedBalance });
      reconciled++;
    }
  }
  return reconciled;
}

async function syncEligibility() {
  const users = await User.find({ targetAmount: { $gt: 0 } }).lean();
  let updated = 0;
  for (const user of users) {
    const approvedSales = await SalesRecord.find({
      employeeId: user._id.toString(),
      financeStatus: "Approved",
    });
    const totalSales = approvedSales.reduce((sum: number, r) => {
      return sum + r.products.reduce((s: number, p: any) => s + p.unitPrice * p.quantity, 0);
    }, 0);
    const achievement = (totalSales / user.targetAmount) * 100;
    const shouldBeEligible = achievement >= 50;
    
    if ((user as any).isEligible !== shouldBeEligible) {
      await User.findByIdAndUpdate(user._id, { isEligible: shouldBeEligible });
      updated++;
    }
  }
  return updated;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    
    await connectToDatabase();
    
    let result;
    switch (type) {
      case "commissions":
        result = await syncCommissions();
        break;
      case "targets":
        result = await syncTargets();
        break;
      case "teams":
        result = await syncTeams();
        break;
      case "wallets":
        result = await syncWallets();
        break;
      case "eligibility":
        result = await syncEligibility();
        break;
      case "all":
        const [c, t, tm, w, e] = await Promise.all([
          syncCommissions(),
          syncTargets(),
          syncTeams(),
          syncWallets(),
          syncEligibility(),
        ]);
        result = { commissions: c, targets: t, teams: tm, wallets: w, eligibility: e };
        break;
      default:
        return NextResponse.json({ error: "Invalid sync type" }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, result, message: `Sync completed: ${JSON.stringify(result)}` });
  } catch (error: any) {
    console.error("Sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    types: ["commissions", "targets", "teams", "wallets", "eligibility", "all"],
    description: {
      commissions: "Recalculate all commission amounts based on current rules",
      targets: "Sync user target periods and validity",
      teams: "Fix orphaned team memberships",
      wallets: "Reconcile wallet balances with transaction history",
      eligibility: "Re-evaluate eligibility for all users with targets",
      all: "Run all sync operations",
    },
  });
}
