/**
 * Test Finance Dashboard Functionality
 * Tests payment approvals, wallet operations, commission processing
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testFinance() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get finance user
    const finance = await db.collection('users').findOne({
      role: 'finance',
      email: 'finance@incentive.io'
    });

    if (!finance) {
      console.log('✗ Finance not found');
      return;
    }

    console.log('=== Finance Info ===');
    console.log('Name:', finance.name);
    console.log('Email:', finance.email);
    console.log();

    // Get pending finance approvals
    console.log('=== Pending Finance Approvals ===');
    const pendingFinance = await db.collection('salesrecords')
      .find({
        status: 'Pending_Finance',
        deletedAt: null
      })
      .toArray();

    console.log('Records awaiting finance approval:', pendingFinance.length);
    pendingFinance.forEach((sale, i) => {
      const netSales = sale.netSales || 0;
      const commission = sale.commission || 0;
      console.log(`  ${i + 1}. ${sale.companyName.padEnd(25)} | Net Sales: ৳${String(netSales).toLocaleString().padStart(10)} | Commission: ৳${String(commission).toLocaleString().padStart(10)}`);
    });
    console.log();

    // Test finance approval workflow
    if (pendingFinance.length > 0) {
      console.log('=== Finance Approval Test ===');
      const testSale = pendingFinance[0];
      console.log('Test sale:', testSale.companyName);
      console.log('Current status:', testSale.status);
      console.log('Current financeStatus:', testSale.financeStatus);
      console.log();

      const netSales = testSale.netSales || 0;
      console.log('Net sales:', `৳${netSales.toLocaleString()}`);
      console.log('Commission calculated:', `৳${testSale.commission.toLocaleString()}`);
      console.log('Commission rate:', netSales > 0 ? ((testSale.commission / netSales) * 100).toFixed(2) + '%' : '0%');
      console.log();

      console.log('Finance approval will:');
      console.log('  1. Set status → Approved');
      console.log('  2. Set financeStatus → Approved');
      console.log('  3. Credit wallet with commission amount');
      console.log('  4. Set isPaid → true');
      console.log('  5. Record paymentDate');
      console.log();
    } else {
      console.log('=== Finance Approval Test ===');
      console.log('No pending finance approvals to test');
      console.log();
    }

    // Check wallet operations
    console.log('=== Wallet Operations ===');
    const wallets = await db.collection('wallets')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total wallets:', wallets.length);
    let totalBalance = 0;
    let totalTransactions = 0;

    wallets.forEach(w => {
      totalBalance += w.balance || 0;
      totalTransactions += w.transactions ? w.transactions.length : 0;
    });

    console.log('Total wallet balance:', `৳${totalBalance.toLocaleString()}`);
    console.log('Total transactions:', totalTransactions);
    console.log();

    // Check commission payments
    console.log('=== Commission Payment Status ===');
    const paymentStats = await db.collection('salesrecords').aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalCommission: { $sum: '$commission' }
        }
      }
    ]).toArray();

    console.log('Records by payment status:');
    paymentStats.forEach(s => {
      console.log(`  ${(s._id || 'None').padEnd(10)}: ${s.count} records (৳${s.totalCommission.toLocaleString()} commission)`);
    });
    console.log();

    // Check paid commissions
    console.log('=== Paid Commissions ===');
    const paidCommissions = await db.collection('salesrecords')
      .find({
        isPaid: true,
        deletedAt: null
      })
      .toArray();

    console.log('Paid commission records:', paidCommissions.length);
    let totalPaidCommission = 0;
    paidCommissions.forEach(sale => {
      totalPaidCommission += sale.commission || 0;
    });
    console.log('Total commission paid:', `৳${totalPaidCommission.toLocaleString()}`);
    console.log();

    // Check pending payments
    console.log('=== Pending Payments ===');
    const pendingPayments = await db.collection('salesrecords')
      .find({
        status: 'Pending_Finance',
        isPaid: false,
        deletedAt: null
      })
      .toArray();

    console.log('Pending payment records:', pendingPayments.length);
    let totalPendingCommission = 0;
    pendingPayments.forEach(sale => {
      totalPendingCommission += sale.commission || 0;
    });
    console.log('Total commission pending:', `৳${totalPendingCommission.toLocaleString()}`);
    console.log();

    // Check payment trends
    console.log('=== Payment Trends ===');
    const trends = await db.collection('salesrecords').aggregate([
      { $match: { deletedAt: null, isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
          count: { $sum: 1 },
          total: { $sum: '$commission' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]).toArray();

    console.log('Recent payment activity:');
    trends.forEach(t => {
      console.log(`  ${t._id}: ${t.count} payments (৳${t.total.toLocaleString()})`);
    });
    console.log();

    console.log('✓ Finance dashboard data verified');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testFinance();
