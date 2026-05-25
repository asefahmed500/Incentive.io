#!/usr/bin/env node

/**
 * Production Database Seed Script
 * Seeds MongoDB Atlas with test users for production deployment
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Test users to seed
const testUsers = [
  { name: 'System Admin', email: 'admin@incentive.io', password: 'Admin123!', role: 'admin', employeeId: 'EMP001', isActive: true },
  { name: 'Super Administrator', email: 'superadmin@incentive.io', password: 'Superadmin123!', role: 'administrator', employeeId: 'EMP002', isActive: true },
  { name: 'Jamal Hassan', email: 'jamal@incentive.io', password: 'Manager123!', role: 'salesManager', employeeId: 'EMP003', isActive: true },
  { name: 'Accountant User', email: 'accountant@incentive.io', password: 'Accountant123!', role: 'accountant', employeeId: 'EMP004', isActive: true },
  { name: 'Finance User', email: 'finance@incentive.io', password: 'Finance123!', role: 'finance', employeeId: 'EMP005', isActive: true },
  { name: 'Karim Uddin', email: 'karim@incentive.io', password: 'Executive123!', role: 'salesExecutive', employeeId: 'EMP006', isActive: true },
];

async function seedProductionDatabase() {
  console.log('🌱 Starting production database seed...');

  // Get MongoDB connection string from environment
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not set');
    console.error('Please set MONGODB_URI to your MongoDB Atlas connection string');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('incentiveio');

    // Check if database already has users
    const userCount = await db.collection('users').countDocuments({ deletedAt: null });
    console.log(`📊 Current users in database: ${userCount}`);

    if (userCount > 0) {
      console.log('⚠️  Database already has users. Skipping seed.');
      console.log('📋 Existing users:');
      const existingUsers = await db.collection('users').find({ deletedAt: null }).project({ email: 1, role: 1, name: 1 }).toArray();
      existingUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));

      await client.close();
      return;
    }

    console.log('🌱 Seeding production database with test users...');

    // Insert test users
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);

      await db.collection('users').insertOne({
        name: user.name,
        email: user.email.toLowerCase(),
        password: hashedPassword,
        role: user.role,
        employeeId: user.employeeId,
        phone: '',
        isActive: user.isActive,
        targetAmount: 0,
        createdAt: new Date(),
        deletedAt: null
      });

      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('');
    console.log('✅ Production database seeded successfully!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('────────────────────────────────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`   ${user.email} / ${user.password} (${user.role})`);
    });
    console.log('────────────────────────────────────────────────────────────');
    console.log('');
    console.log('🌐 Production URL: https://incentiveio.vercel.app');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedProductionDatabase();