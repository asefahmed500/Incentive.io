import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendWelcomeEmail, sendNotificationEmail } from "@/lib/email";
import { notifyUserCreated } from "@/lib/actions/notification.actions";

export async function getUsers({
  search = "",
  role = "all",
}: {
  search?: string;
  role?: string;
}) {
  await connectToDatabase();

  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role !== "all") {
    query.role = role;
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    employeeId: u.employeeId,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
}

export async function createUser({
  name,
  email,
  password,
  role,
  phone,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}) {
  await connectToDatabase();

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return { error: "Email already registered" };
  }

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 10);
  const employeeId = Math.floor(10000 + Math.random() * 90000).toString();

  await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    phone: phone || "",
    employeeId,
    isActive: true,
    targetAmount: 0,
  });

  // Send welcome email
  try {
    await sendWelcomeEmail(email.toLowerCase(), name);
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
  }

  // Get created user to send in-app notification
  const createdUser = await User.findOne({ email: email.toLowerCase() });
  if (createdUser) {
    try {
      await notifyUserCreated(createdUser._id.toString(), name, role);
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }
  }

  return { success: true };
}

export async function updateUser({
  id,
  name,
  email,
  role,
  phone,
  isActive,
}: {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}) {
  await connectToDatabase();

  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();
  if (role) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone;
  if (isActive !== undefined) updateData.isActive = isActive;

  await User.findByIdAndUpdate(id, updateData);

  return { success: true };
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  await User.findByIdAndDelete(id);
  return { success: true };
}

export async function getUserById(id: string) {
  await connectToDatabase();
  const user = await User.findById(id).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    phone: user.phone,
    isActive: user.isActive,
    managerId: user.managerId?.toString(),
  };
}

export async function getManagerForUser(userId: string) {
  await connectToDatabase();
  const user = await User.findById(userId).populate("managerId", "name email phone").lean();
  if (!user || !user.managerId) return null;
  const mgr = user.managerId as any;
  return {
    id: mgr._id.toString(),
    name: mgr.name,
    email: mgr.email,
    phone: mgr.phone || "",
  };
}

export async function toggleUserStatus(id: string) {
  await connectToDatabase();
  const user = await User.findById(id);
  if (!user) return { error: "User not found" };
  
  await User.findByIdAndUpdate(id, { isActive: !user.isActive });
  return { success: true };
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found" };
  }

  const bcrypt = require("bcryptjs");
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  return { success: true };
}

export async function resetPassword({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) {
  await connectToDatabase();

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const user = await User.findById(userId);
  if (!user) return { error: "User not found" };
  
  await User.findByIdAndUpdate(userId, { password: hashedPassword });

  // Send password reset notification email
  try {
    await sendNotificationEmail(
      user.email,
      "Password Reset",
      `Hi ${user.name},<br><br>Your password has been reset by an administrator. Please log in with your new password and change it immediately.`
    );
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
  }

  return { success: true };
}
