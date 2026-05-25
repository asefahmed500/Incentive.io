/**
 * Test Administrator Dashboard Functionality
 * Tests full system access, user management, settings, audit logs
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testAdministrator() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get administrator
    const admin = await db.collection('users').findOne({
      role: 'administrator',
      email: 'superadmin@incentive.io'
    });

    if (!admin) {
      console.log('✗ Administrator not found');
      return;
    }

    console.log('=== Administrator Info ===');
    console.log('Name:', admin.name);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log();

    // User management
    console.log('=== User Management ===');
    const userStats = await db.collection('users').aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('Users by role:');
    userStats.forEach(s => {
      console.log(`  ${s._id.padEnd(18)}: ${s.count} total (${s.active} active)`);
    });
    console.log();

    // Team management
    console.log('=== Team Management ===');
    const teams = await db.collection('teams')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total teams:', teams.length);
    teams.forEach((team, i) => {
      const memberCount = team.members ? team.members.length : 0;
      console.log(`  ${i + 1}. ${team.name.padEnd(25)} | Members: ${memberCount}`);
    });
    console.log();

    // Category management
    console.log('=== Category Management ===');
    const categories = await db.collection('categories')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total categories:', categories.length);
    let autoApproveCount = 0;
    categories.forEach(cat => {
      if (cat.autoApprove) autoApproveCount++;
      console.log(`  - ${cat.name.padEnd(25)} | Auto-Approve: ${cat.autoApprove ? 'Yes' : 'No'}`);
    });
    console.log('Auto-approve categories:', autoApproveCount);
    console.log();

    // Product management
    console.log('=== Product Management ===');
    const products = await db.collection('products')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total products:', products.length);
    let totalStockValue = 0;
    products.forEach(p => {
      totalStockValue += p.price * p.stock;
    });
    console.log('Total stock value:', `৳${totalStockValue.toLocaleString()}`);
    console.log();

    // Commission rules
    console.log('=== Commission Rules ===');
    const rules = await db.collection('commissionrules')
      .find({ deletedAt: null })
      .sort({ priority: -1 })
      .toArray();

    console.log('Active rules:', rules.length);
    rules.forEach(r => {
      console.log(`  ${r.targetPercentageFrom}%-${r.targetPercentageTo}% → ${r.commissionRate}% commission (Priority: ${r.priority}) ${r.isActive ? '[Active]' : '[Inactive]'}`);
    });
    console.log();

    // Settings
    console.log('=== System Settings ===');
    const settings = await db.collection('systemsettings')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total settings:', settings.length);
    const settingsByCategory = {};
    settings.forEach(s => {
      if (!settingsByCategory[s.category]) settingsByCategory[s.category] = [];
      settingsByCategory[s.category].push(s);
    });

    Object.entries(settingsByCategory).forEach(([category, items]) => {
      console.log(`  ${category}: ${items.length} settings`);
    });
    console.log();

    // Audit logs
    console.log('=== Audit Logs ===');
    const auditLogs = await db.collection('auditlogs')
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log('Recent audit logs (last 10):');
    auditLogs.forEach((log, i) => {
      const date = new Date(log.createdAt).toLocaleString();
      console.log(`  ${i + 1}. [${date}] ${log.action} | Entity: ${log.entity} | User: ${log.userId?.toString().substring(0, 8)}...`);
    });
    console.log();

    // System health
    console.log('=== System Health ===');
    const collections = await db.listCollections().toArray();
    console.log('Database collections:', collections.length);

    const collectionStats = await Promise.all(collections.map(async (coll) => {
      const count = await db.collection(coll.name).countDocuments();
      return { name: coll.name, count };
    }));

    console.log('\nCollection sizes:');
    collectionStats.forEach(s => {
      if (s.count > 0) {
        console.log(`  ${s.name.padEnd(25)}: ${s.count} documents`);
      }
    });
    console.log();

    // Database size
    const stats = await db.stats();
    console.log('Database size:', (stats.dataSize / 1024).toFixed(2), 'KB');
    console.log('Index size:', (stats.totalSize / 1024).toFixed(2), 'KB');
    console.log();

    console.log('✓ Administrator dashboard data verified');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testAdministrator();
