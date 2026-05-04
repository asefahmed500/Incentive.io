import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../lib/mongodb";
import { User } from "../lib/models/User";
import { Team } from "../lib/models/Team";
import { Category } from "../lib/models/Category";
import { Product } from "../lib/models/Product";
import CommissionRule from "../lib/models/CommissionRule";
import { SalesRecord } from "../lib/models/SalesRecord";
import { Wallet } from "../lib/models/Wallet";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  console.log("Connecting to database...");
  await connectToDatabase();
  
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    CommissionRule.deleteMany({}),
    SalesRecord.deleteMany({}),
    Wallet.deleteMany({}),
  ]);

  console.log("Creating users...");
  const adminPassword = await hashPassword("Admin123!");
  const superPassword = await hashPassword("Superadmin123!");
  const managerPassword = await hashPassword("Manager123!");
  const execPassword = await hashPassword("Executive123!");
  const accountantPassword = await hashPassword("Accountant123!");
  const financePassword = await hashPassword("Finance123!");

  const admin = await User.create({
    name: "System Admin",
    email: "admin@incentive.io",
    password: adminPassword,
    role: "admin",
    employeeId: "EMP001",
    phone: "+8801700000001",
    isActive: true,
    targetAmount: 0,
  });

  const superAdmin = await User.create({
    name: "Super Administrator",
    email: "superadmin@incentive.io",
    password: superPassword,
    role: "administrator",
    employeeId: "EMP002",
    phone: "+8801700000002",
    isActive: true,
    targetAmount: 0,
  });

  const manager1 = await User.create({
    name: "Jamal Hassan",
    email: "jamal@incentive.io",
    password: managerPassword,
    role: "salesManager",
    employeeId: "EMP003",
    phone: "+8801700000003",
    isActive: true,
    targetAmount: 500000,
    targetPeriod: "monthly",
  });

  const manager2 = await User.create({
    name: "Fatima Rahman",
    email: "fatima@incentive.io",
    password: managerPassword,
    role: "salesManager",
    employeeId: "EMP004",
    phone: "+8801700000004",
    isActive: true,
    targetAmount: 600000,
    targetPeriod: "monthly",
  });

  const executives: mongoose.Types.ObjectId[] = [];
  const execData = [
    { name: "Karim Uddin", email: "karim@incentive.io", empId: "EMP005", target: 300000 },
    { name: "Nasrin Akter", email: "nasrin@incentive.io", empId: "EMP006", target: 350000 },
    { name: "Rahim Islam", email: "rahim@incentive.io", empId: "EMP007", target: 280000 },
    { name: "Sabina Yasmin", email: "sabina@incentive.io", empId: "EMP008", target: 320000 },
    { name: "Mizanur Shah", email: "mizanur@incentive.io", empId: "EMP009", target: 400000 },
    { name: "Anika Begum", email: "anika@incentive.io", empId: "EMP010", target: 250000 },
  ];

  for (const e of execData) {
    const user = await User.create({
      name: e.name,
      email: e.email,
      password: await hashPassword("Executive123!"),
      role: "salesExecutive",
      employeeId: e.empId,
      phone: `+8801700${execData.indexOf(e) + 5}0000${execData.indexOf(e) + 5}`,
      isActive: true,
      targetAmount: e.target,
      targetPeriod: "monthly",
      managerId: execData.indexOf(e) < 3 ? manager1._id : manager2._id,
    });
    executives.push(user._id as mongoose.Types.ObjectId);
  }

  const accountant = await User.create({
    name: "Rezwan Ali",
    email: "accountant@incentive.io",
    password: accountantPassword,
    role: "accountant",
    employeeId: "EMP011",
    phone: "+8801700000011",
    isActive: true,
    targetAmount: 0,
  });

  const finance = await User.create({
    name: "Nihar Khan",
    email: "finance@incentive.io",
    password: financePassword,
    role: "finance",
    employeeId: "EMP012",
    phone: "+8801700000012",
    isActive: true,
    targetAmount: 0,
  });

  const inactiveUser = await User.create({
    name: "Inactive User",
    email: "inactive@incentive.io",
    password: await hashPassword("Inactive123!"),
    role: "salesExecutive",
    employeeId: "EMP013",
    phone: "+8801700000013",
    isActive: false,
    targetAmount: 200000,
    managerId: manager1._id,
  });

  console.log("Creating teams...");
  const team1 = await Team.create({
    name: "Alpha Team",
    managerId: manager1._id,
    members: executives.slice(0, 3),
  });

  const team2 = await Team.create({
    name: "Beta Team",
    managerId: manager2._id,
    members: executives.slice(3),
  });

  await User.updateMany(
    { _id: { $in: executives.slice(0, 3) } },
    { $set: { teamId: team1._id } }
  );
  await User.updateMany(
    { _id: { $in: executives.slice(3) } },
    { $set: { teamId: team2._id } }
  );

  console.log("Creating categories...");
  const categories = await Category.create([
    { name: "Software", description: "Software products and licenses" },
    { name: "Hardware", description: "Hardware and equipment" },
    { name: "Services", description: "Consulting and professional services" },
    { name: "Cloud", description: "Cloud and SaaS products" },
    { name: "Security", description: "Cybersecurity products" },
  ]);

  console.log("Creating products...");
  const products = await Product.create([
    { name: "Enterprise ERP", sku: "ERP-001", categoryId: categories[0]._id, price: 50000, stock: 100 },
    { name: "CRM Pro", sku: "CRM-001", categoryId: categories[0]._id, price: 25000, stock: 200 },
    { name: "Cloud Storage 1TB", sku: "CS-001", categoryId: categories[3]._id, price: 12000, stock: 500 },
    { name: "Firewall Appliance", sku: "FW-001", categoryId: categories[4]._id, price: 35000, stock: 50 },
    { name: "Laptop Bundle", sku: "LT-001", categoryId: categories[1]._id, price: 80000, stock: 75 },
    { name: "Consulting Day", sku: "CON-001", categoryId: categories[2]._id, price: 15000, stock: 999 },
    { name: "Backup Solution", sku: "BK-001", categoryId: categories[3]._id, price: 20000, stock: 150 },
    { name: "Antivirus Suite", sku: "AV-001", categoryId: categories[4]._id, price: 8000, stock: 300 },
  ]);

  console.log("Creating commission rules...");
  await CommissionRule.create([
    { targetPercentageFrom: 0, targetPercentageTo: 80, commissionRate: 2.0, priority: 1, isActive: true },
    { targetPercentageFrom: 81, targetPercentageTo: 100, commissionRate: 3.0, priority: 2, isActive: true },
    { targetPercentageFrom: 101, targetPercentageTo: 150, commissionRate: 4.5, priority: 3, isActive: true },
    { targetPercentageFrom: 151, targetPercentageTo: 999, commissionRate: 5.0, priority: 4, isActive: true },
  ]);

  console.log("Creating sales records...");
  const exec1 = executives[0];
  const exec2 = executives[1];
  const exec3 = executives[2];
  const exec4 = executives[3];

  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

  await SalesRecord.create([
    {
      employeeId: exec1.toString(),
      employeeName: "Karim Uddin",
      companyName: "Acme Corp",
      companyEmail: "purchasing@acme.com",
      products: [
        { productName: "Enterprise ERP", categoryId: categories[0]._id, unitPrice: 50000, quantity: 2 },
        { productName: "CRM Pro", categoryId: categories[0]._id, unitPrice: 25000, quantity: 1 },
      ],
      taxEnabled: true,
      vatEnabled: true,
      taxRate: 5,
      taxAmount: 6250,
      vatRate: 10,
      vatAmount: 12500,
      eoBpAmount: 2000,
      netSales: 117500,
      status: "Approved",
      approvalStatus: "Approved",
      accountantStatus: "Approved",
      financeStatus: "Approved",
      commission: 3525,
      calculatedCommission: 3525,
      managerId: manager1._id,
      approvedBy: manager1._id,
      approvedAt: lastMonth,
      processedAt: lastMonth,
      finalApprovedAt: lastMonth,
      isPaid: true,
      paymentStatus: "Paid",
      paymentDate: lastMonth,
      paidBy: finance._id,
    },
    {
      employeeId: exec1.toString(),
      employeeName: "Karim Uddin",
      companyName: "TechStart Ltd",
      companyEmail: "sales@techstart.io",
      products: [
        { productName: "Cloud Storage 1TB", categoryId: categories[3]._id, unitPrice: 12000, quantity: 5 },
      ],
      taxEnabled: false,
      vatEnabled: true,
      taxRate: 0,
      taxAmount: 0,
      vatRate: 10,
      vatAmount: 6000,
      eoBpAmount: 0,
      netSales: 54000,
      status: "Pending_Finance",
      approvalStatus: "Approved",
      accountantStatus: "Approved",
      financeStatus: "Pending",
      commission: 1620,
      calculatedCommission: 1620,
      managerId: manager1._id,
      approvedBy: manager1._id,
      approvedAt: now,
      processedAt: now,
    },
    {
      employeeId: exec2.toString(),
      employeeName: "Nasrin Akter",
      companyName: "Global Industries",
      companyEmail: "procurement@global.com",
      products: [
        { productName: "Firewall Appliance", categoryId: categories[4]._id, unitPrice: 35000, quantity: 3 },
      ],
      taxEnabled: true,
      vatEnabled: true,
      taxRate: 5,
      taxAmount: 5250,
      vatRate: 10,
      vatAmount: 10500,
      eoBpAmount: 1500,
      netSales: 91150,
      status: "Pending_Accountant",
      approvalStatus: "Approved",
      accountantStatus: "Pending",
      financeStatus: "Pending",
      commission: 2734.5,
      calculatedCommission: 2734.5,
      managerId: manager1._id,
      approvedBy: manager1._id,
      approvedAt: now,
    },
    {
      employeeId: exec3.toString(),
      employeeName: "Rahim Islam",
      companyName: "DataFlow Inc",
      companyEmail: "orders@dataflow.com",
      products: [
        { productName: "Consulting Day", categoryId: categories[2]._id, unitPrice: 15000, quantity: 10 },
      ],
      taxEnabled: false,
      vatEnabled: false,
      taxRate: 0,
      taxAmount: 0,
      vatRate: 0,
      vatAmount: 0,
      eoBpAmount: 0,
      netSales: 150000,
      status: "Pending_Manager",
      approvalStatus: "Pending",
      accountantStatus: "Pending",
      financeStatus: "Pending",
      commission: 4500,
      calculatedCommission: 4500,
      managerId: manager1._id,
    },
    {
      employeeId: exec4.toString(),
      employeeName: "Sabina Yasmin",
      companyName: "NextWave Solutions",
      companyEmail: "info@nextwave.com",
      products: [
        { productName: "Laptop Bundle", categoryId: categories[1]._id, unitPrice: 80000, quantity: 2 },
        { productName: "Antivirus Suite", categoryId: categories[4]._id, unitPrice: 8000, quantity: 10 },
      ],
      taxEnabled: true,
      vatEnabled: true,
      taxRate: 0,
      taxAmount: 0,
      vatRate: 0,
      vatAmount: 0,
      eoBpAmount: 0,
      netSales: 240000,
      status: "Draft",
      approvalStatus: "Pending",
      accountantStatus: "Pending",
      financeStatus: "Pending",
      commission: 7200,
      calculatedCommission: 7200,
      managerId: manager2._id,
    },
    {
      employeeId: executives[4].toString(),
      employeeName: "Mizanur Shah",
      companyName: "Star Enterprises",
      companyEmail: "buy@star.com",
      products: [
        { productName: "Backup Solution", categoryId: categories[3]._id, unitPrice: 20000, quantity: 3 },
      ],
      taxEnabled: true,
      vatEnabled: false,
      taxRate: 5,
      taxAmount: 3000,
      vatRate: 0,
      vatAmount: 0,
      eoBpAmount: 1000,
      netSales: 56000,
      status: "Approved",
      approvalStatus: "Approved",
      accountantStatus: "Approved",
      financeStatus: "Approved",
      commission: 2800,
      calculatedCommission: 2800,
      managerId: manager2._id,
      approvedBy: manager2._id,
      approvedAt: lastMonth,
      processedAt: lastMonth,
      finalApprovedAt: lastMonth,
      isPaid: true,
      paymentStatus: "Paid",
      paymentDate: lastMonth,
      paidBy: finance._id,
    },
  ]);

  console.log("Creating wallets...");
  for (const execId of executives) {
    await Wallet.create({
      employeeId: execId,
      balance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalPaid: 0,
      transactions: [],
    });
  }

  console.log("\nSeed completed successfully!");
  console.log("\nTest Accounts:");
  console.log("  Admin:     admin@incentive.io / Admin123!");
  console.log("  Super:     superadmin@incentive.io / Superadmin123!");
  console.log("  Manager1:  jamal@incentive.io / Manager123!");
  console.log("  Manager2:  fatima@incentive.io / Manager123!");
  console.log("  Exec x6:  {karim,nasrin,rahim,sabina,mizanur,anika}@incentive.io / Executive123!");
  console.log("  Acct:      accountant@incentive.io / Accountant123!");
  console.log("  Finance:   finance@incentive.io / Finance123!");
  console.log("  Inactive:  inactive@incentive.io / Inactive123! (blocked)");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});