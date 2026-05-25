#!/usr/bin/env node

/**
 * Verify password hashes for production users
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function verifyPasswords() {
  const { MongoClient } = await import('mongodb');
  const bcrypt = await import('bcryptjs');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    // Test accounts to verify
    const testAccounts = [
      { email: 'karim@incentive.io', password: 'Executive123!', role: 'salesExecutive' },
      { email: 'jamal@incentive.io', password: 'Manager123!', role: 'salesManager' },
      { email: 'accountant@incentive.io', password: 'Accountant123!', role: 'accountant' },
      { email: 'finance@incentive.io', password: 'Finance123!', role: 'finance' },
      { email: 'admin@incentive.io', password: 'Admin123!', role: 'admin' },
      { email: 'superadmin@incentive.io', password: 'Superadmin123!', role: 'administrator' },
    ];

    console.log('\n🔐 Verifying password hashes:');
    console.log('─'.repeat(70));

    for (const account of testAccounts) {
      const user = await db.collection('users').findOne({
        email: account.email.toLowerCase(),
        deletedAt: null
      });

      if (!user) {
        console.log(`❌ ${account.email} - USER NOT FOUND`);
        continue;
      }

      const isValid = await bcrypt.compare(account.password, user.password);

      if (isValid) {
        console.log(`✅ ${account.email} (${account.role}) - PASSWORD VALID`);
      } else {
        console.log(`❌ ${account.email} (${account.role}) - PASSWORD INVALID`);
        console.log(`   Testing alternative passwords...`);

        // Try common alternatives
        const alternatives = [
          'Executive123!',
          'Manager123!',
          'Accountant123!',
          'Finance123!',
          'Admin123!',
          'Superadmin123!',
        ];

        for (const alt of alternatives) {
          const altValid = await bcrypt.compare(alt, user.password);
          if (altValid) {
            console.log(`   ✅ Found valid password: ${alt}`);
            break;
          }
        }
      }
    }

    console.log('─'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

verifyPasswords().catch(console.error);
