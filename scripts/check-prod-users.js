#!/usr/bin/env node

/**
 * Quick check of production database users
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function checkUsers() {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    // Count total users
    const totalUsers = await db.collection('users').countDocuments({ deletedAt: null });
    console.log(`📊 Total users: ${totalUsers}`);

    // List all users
    const users = await db.collection('users').find({ deletedAt: null }).project({
      name: 1,
      email: 1,
      role: 1,
      isActive: 1,
      employeeId: 1
    }).toArray();

    console.log('\n👥 Users in database:');
    console.log('─'.repeat(70));
    for (const user of users) {
      console.log(`   ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Employee ID: ${user.employeeId} | Active: ${user.isActive}`);
      console.log('');
    }
    console.log('─'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkUsers().catch(console.error);
