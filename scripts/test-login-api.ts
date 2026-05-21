/**
 * Test script to verify login API works correctly
 */

import { connectToDatabase } from "../lib/mongodb";
import { User } from "../lib/models/User";
import bcrypt from "bcryptjs";

async function testLogin() {
  await connectToDatabase();

  const testEmail = "karim@incentive.io";
  const testPassword = "Executive123!";

  // Find user
  const user = await User.findOne({ email: testEmail.toLowerCase(), isActive: true });

  if (!user) {
    console.log("❌ User not found:", testEmail);
    return;
  }

  console.log("✓ User found:", user.email, "Role:", user.role, "Active:", user.isActive);

  // Check password
  const isValid = await bcrypt.compare(testPassword, user.password);

  if (!isValid) {
    console.log("❌ Password verification failed");
  } else {
    console.log("✓ Password verified successfully");

    // Check user data
    console.log("  User ID:", user._id.toString());
    console.log("  Name:", user.name);
    console.log("  Role:", user.role);
    console.log("  Employee ID:", user.employeeId?.toString());
  }

  await (await import("mongoose")).connection.close();
}

testLogin().catch(console.error);
