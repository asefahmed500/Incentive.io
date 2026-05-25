#!/usr/bin/env node

/**
 * Quick Production Database Seed
 * Seeds MongoDB Atlas with all test users for production deployment
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function seedProduction() {
  const { MongoClient } = await import('mongodb');
  const bcrypt = await import('bcryptjs');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    // Check existing users
    const existingUsers = await db.collection('users').countDocuments({ deletedAt: null });
    console.log(`📊 Existing users: ${existingUsers}`);

    if (existingUsers > 0) {
      console.log('⚠️  Database already seeded. Skipping.');
      return;
    }

    // Test users to create
    const users = [
      { name: 'System Admin', email: 'admin@incentive.io', password: 'Admin123!', role: 'admin', employeeId: 'EMP001' },
      { name: 'Super Administrator', email: 'superadmin@incentive.io', password: 'Superadmin123!', role: 'administrator', employeeId: 'EMP002' },
      { name: 'Jamal Hassan', email: 'jamal@incentive.io', password: 'Manager123!', role: 'salesManager', employeeId: 'EMP003' },
      { name: 'Accountant User', email: 'accountant@incentive.io', password: 'Accountant123!', role: 'accountant', employeeId: 'EMP004' },
      { name: 'Finance User', email: 'finance@incentive.io', password: 'Finance123!', role: 'finance', employeeId: 'EMP005' },
      { name: 'Karim Uddin', email: 'karim@incentive.io', password: 'Executive123!', role: 'salesExecutive', employeeId: 'EMP006' },
    ];

    console.log('🌱 Seeding production database...');

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);

      await db.collection('users').insertOne({
        name: user.name,
        email: user.email.toLowerCase(),
        password: hashedPassword,
        role: user.role,
        employeeId: user.employeeId,
        phone: '',
        isActive: true,
        targetAmount: 0,
        createdAt: new Date(),
        deletedAt: null
      });

      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('');
    console.log('✅ Production database seeded successfully!');
    console.log('');
    console.log('📋 Test Accounts (Production):');
    console.log('─'.repeat(60));
    for (const user of users) {
      console.log(`   ${user.email} / ${user.password} (${user.role})`);
    }
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

seedProduction().catch(console.error);
