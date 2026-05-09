/**
 * Debug script for aggregation test
 */

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { SalesRecord } from "@/lib/models/SalesRecord";

async function testAggregation() {
  await connectToDatabase();
  const bcrypt = (await import("bcryptjs")).default;
  const password = await bcrypt.hash("Test123!", 10);

  // Create user
  const user = await User.create({
    name: "Debug User",
    email: "debug_" + Date.now() + "@test.com",
    password,
    role: "salesExecutive",
    targetAmount: 100000,
  });
  const userId = user._id.toString();
  console.log("Created user:", userId);

  // Create sales records
  const sale1 = await SalesRecord.create({
    employeeId: userId,
    employeeName: "Test Employee",
    companyName: "Company 1",
    companyEmail: "test1@company.com",
    products: [{ productName: "P1", categoryId: new mongoose.Types.ObjectId(), unitPrice: 30000, quantity: 1 }],
    commission: 3000,
    status: "Approved",
    approvalStatus: "Approved",
    financeStatus: "Approved",
    isPaid: true,
  });

  const sale2 = await SalesRecord.create({
    employeeId: userId,
    employeeName: "Test Employee",
    companyName: "Company 2",
    companyEmail: "test2@company.com",
    products: [{ productName: "P2", categoryId: new mongoose.Types.ObjectId(), unitPrice: 30000, quantity: 1 }],
    commission: 3000,
    status: "Approved",
    approvalStatus: "Approved",
    financeStatus: "Approved",
    isPaid: true,
  });

  console.log("Created sales:", sale1._id, sale2._id);

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test different aggregation approaches
  console.log("\n--- Test 1: Simple match ---");
  const simpleMatch = await SalesRecord.find({ employeeId: new mongoose.Types.ObjectId(userId), status: "Approved" });
  console.log("Simple match count:", simpleMatch?.length || 0);

  console.log("\n--- Test 2: Aggregate without ObjectId ---");
  const aggNoObjectId = await SalesRecord.aggregate([
    { $match: { employeeId: userId, status: "Approved" } },
    { $count: "count" },
  ]);
  console.log("Aggregate without ObjectId:", aggNoObjectId);

  console.log("\n--- Test 3: Aggregate with ObjectId ---");
  const aggWithObjectId = await SalesRecord.aggregate([
    { $match: { employeeId: new mongoose.Types.ObjectId(userId), status: "Approved" } },
    { $count: "count" },
  ]);
  console.log("Aggregate with ObjectId:", aggWithObjectId);

  console.log("\n--- Test 4: Full aggregation pipeline ---");
  const fullAgg = await SalesRecord.aggregate([
    { $match: { employeeId: new mongoose.Types.ObjectId(userId), status: "Approved" } },
    {
      $group: {
        _id: "$employeeId",
        totalSales: { $sum: "$commission" },
        count: { $sum: 1 },
      },
    },
  ]);
  console.log("Full aggregation:", fullAgg);

  // Cleanup
  await SalesRecord.deleteMany({ employeeId: userId });
  await User.findByIdAndDelete(userId);

  console.log("\n✓ Debug complete");
  process.exit(0);
}

testAggregation().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
