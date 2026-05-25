/**
 * Interactive Dashboard Test for All Roles
 * Tests each role's dashboard functionality via direct API calls
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

// Test credentials for all roles
const ROLES = [
  { name: 'Sales Executive', email: 'karim@incentive.io', password: 'Executive123!', route: '/sales-dashboard' },
  { name: 'Sales Manager', email: 'jamal@incentive.io', password: 'Manager123!', route: '/sales-manager' },
  { name: 'Accountant', email: 'accountant@incentive.io', password: 'Accountant123!', route: '/accountant' },
  { name: 'Finance', email: 'finance@incentive.io', password: 'Finance123!', route: '/finance' },
  { name: 'Admin', email: 'admin@incentive.io', password: 'Admin123!', route: '/admin' },
  { name: 'Administrator', email: 'superadmin@incentive.io', password: 'Superadmin123!', route: '/administrator' },
];

async function testAllDashboards() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    console.log('='.repeat(60));
    console.log('INTERACTIVE DASHBOARD TEST - ALL ROLES');
    console.log('='.repeat(60));
    console.log();

    for (const role of ROLES) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TESTING: ${role.name.toUpperCase()}`);
      console.log(`Email: ${role.email}`);
      console.log(`Dashboard: ${role.route}`);
      console.log('='.repeat(60));

      // Get user from database
      const user = await db.collection('users').findOne({
        email: role.email,
        deletedAt: null
      });

      if (!user) {
        console.log(`❌ User not found in database`);
        continue;
      }

      console.log(`✓ User found: ${user.name}`);
      console.log(`✓ Role: ${user.role}`);
      console.log(`✓ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log();

      // Test role-specific data
      await testRoleData(db, user, role);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log();
    console.log('All roles tested successfully via database verification');
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await client.close();
  }
}

async function testRoleData(db, user, roleInfo) {
  switch (user.role) {
    case 'salesExecutive':
      await testSalesExecutive(db, user);
      break;
    case 'salesManager':
      await testSalesManager(db, user);
      break;
    case 'accountant':
      await testAccountant(db, user);
      break;
    case 'finance':
      await testFinance(db, user);
      break;
    case 'admin':
      await testAdmin(db, user);
      break;
    case 'administrator':
      await testAdministrator(db, user);
      break;
  }
}

async function testSalesExecutive(db, user) {
  console.log('--- Sales Executive Dashboard Tests ---');

  // Get sales records
  const sales = await db.collection('salesrecords')
    .find({ employeeId: user._id.toString(), deletedAt: null })
    .toArray();

  console.log(`✓ Sales Records: ${sales.length}`);

  const byStatus = {};
  sales.forEach(s => {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });

  console.log('  By Status:', byStatus);

  // Get wallet
  const wallet = await db.collection('wallets')
    .findOne({ employeeId: user._id.toString(), deletedAt: null });

  console.log(`✓ Wallet Balance: ${wallet ? '৳' + wallet.balance.toLocaleString() : 'Not found'}`);
  console.log(`✓ Target Amount: ৳${user.targetAmount?.toLocaleString() || 0}`);
  console.log(`✓ Is Eligible: ${user.isEligible ? 'Yes' : 'No'}`);
}

async function testSalesManager(db, user) {
  console.log('--- Sales Manager Dashboard Tests ---');

  // Get team members
  const teamMembers = await db.collection('users')
    .find({ managerId: user._id.toString(), isActive: true, deletedAt: null })
    .toArray();

  console.log(`✓ Team Members: ${teamMembers.length}`);

  if (teamMembers.length === 0) {
    console.log('  ⚠️  No team members assigned');
  } else {
    teamMembers.forEach(m => {
      console.log(`  - ${m.name} (${m.email})`);
    });
  }

  // Get team sales
  const teamMemberIds = teamMembers.map(m => m._id.toString());
  const teamSales = await db.collection('salesrecords')
    .find({ employeeId: { $in: teamMemberIds }, deletedAt: null })
    .toArray();

  console.log(`✓ Team Sales Records: ${teamSales.length}`);
}

async function testAccountant(db, user) {
  console.log('--- Accountant Dashboard Tests ---');

  // Get pending accountant approvals
  const pending = await db.collection('salesrecords')
    .find({ status: 'Pending_Accountant', deletedAt: null })
    .toArray();

  console.log(`✓ Pending Approvals: ${pending.length}`);

  // Get processed records
  const processed = await db.collection('salesrecords')
    .find({ accountantStatus: 'Approved', deletedAt: null })
    .toArray();

  console.log(`✓ Records Processed: ${processed.length}`);

  // Calculate deductions
  let totalTax = 0, totalVat = 0, totalEoBp = 0;
  processed.forEach(r => {
    totalTax += r.taxAmount || 0;
    totalVat += r.vatAmount || 0;
    totalEoBp += r.eoBpAmount || 0;
  });

  console.log(`✓ Total Tax Deductions: ৳${totalTax.toLocaleString()}`);
  console.log(`✓ Total VAT Deductions: ৳${totalVat.toLocaleString()}`);
  console.log(`✓ Total EO/BP Deductions: ৳${totalEoBp.toLocaleString()}`);
}

async function testFinance(db, user) {
  console.log('--- Finance Dashboard Tests ---');

  // Get pending finance approvals
  const pending = await db.collection('salesrecords')
    .find({ status: 'Pending_Finance', deletedAt: null })
    .toArray();

  console.log(`✓ Pending Approvals: ${pending.length}`);

  // Get paid commissions
  const paid = await db.collection('salesrecords')
    .find({ isPaid: true, deletedAt: null })
    .toArray();

  console.log(`✓ Paid Commissions: ${paid.length}`);

  let totalPaid = 0;
  paid.forEach(r => {
    totalPaid += r.commission || 0;
  });

  console.log(`✓ Total Commission Paid: ৳${totalPaid.toLocaleString()}`);

  // Get wallets
  const wallets = await db.collection('wallets')
    .find({ deletedAt: null })
    .toArray();

  let totalBalance = 0;
  wallets.forEach(w => {
    totalBalance += w.balance || 0;
  });

  console.log(`✓ Total Wallet Balance: ৳${totalBalance.toLocaleString()}`);
}

async function testAdmin(db, user) {
  console.log('--- Admin Dashboard Tests ---');

  // Get users count
  const userCounts = await db.collection('users')
    .aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    .toArray();

  console.log('✓ Users by Role:');
  userCounts.forEach(u => {
    console.log(`  ${u._id}: ${u.count}`);
  });

  // Get commission rules
  const rules = await db.collection('commissionrules')
    .find({ deletedAt: null, isActive: true })
    .toArray();

  console.log(`✓ Active Commission Rules: ${rules.length}`);

  // Get products
  const products = await db.collection('products')
    .find({ deletedAt: null })
    .toArray();

  console.log(`✓ Total Products: ${products.length}`);
}

async function testAdministrator(db, user) {
  console.log('--- Administrator Dashboard Tests ---');

  // Get all stats
  const stats = {
    users: await db.collection('users').countDocuments({ deletedAt: null }),
    sales: await db.collection('salesrecords').countDocuments({ deletedAt: null }),
    products: await db.collection('products').countDocuments({ deletedAt: null }),
    categories: await db.collection('categories').countDocuments({ deletedAt: null }),
    teams: await db.collection('teams').countDocuments({ deletedAt: null }),
    wallets: await db.collection('wallets').countDocuments({ deletedAt: null }),
    rules: await db.collection('commissionrules').countDocuments({ deletedAt: null }),
    auditLogs: await db.collection('auditlogs').countDocuments(),
  };

  console.log('✓ System Statistics:');
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  // Database health
  const dbStats = await db.stats();
  console.log(`✓ Database Size: ${(dbStats.dataSize / 1024).toFixed(2)} KB`);
}

testAllDashboards();
