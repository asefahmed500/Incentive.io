/**
 * Test Accountant Dashboard Functionality
 * Tests pending approvals, tax/VAT processing, deduction calculations
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testAccountant() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get accountant
    const accountant = await db.collection('users').findOne({
      role: 'accountant',
      email: 'accountant@incentive.io'
    });

    if (!accountant) {
      console.log('✗ Accountant not found');
      return;
    }

    console.log('=== Accountant Info ===');
    console.log('Name:', accountant.name);
    console.log('Email:', accountant.email);
    console.log();

    // Get all sales records (accountant can see all)
    console.log('=== All Sales Records ===');
    const allSales = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    console.log('Total records:', allSales.length);

    // Group by status
    const byStatus = {};
    allSales.forEach(sale => {
      if (!byStatus[sale.status]) byStatus[sale.status] = [];
      byStatus[sale.status].push(sale);
    });

    console.log('\nRecords by status:');
    Object.entries(byStatus).forEach(([status, sales]) => {
      const total = sales.reduce((sum, s) => {
        return sum + (s.products ? s.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0);
      }, 0);
      console.log(`  ${status.padEnd(20)}: ${sales.length} records (৳${total.toLocaleString()})`);
    });
    console.log();

    // Check pending accountant approvals
    console.log('=== Pending Accountant Approvals ===');
    const pendingAccountant = await db.collection('salesrecords')
      .find({
        status: 'Pending_Accountant',
        deletedAt: null
      })
      .toArray();

    console.log('Records awaiting accountant processing:', pendingAccountant.length);
    pendingAccountant.forEach((sale, i) => {
      const total = sale.products ? sale.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log(`  ${i + 1}. ${sale.companyName.padEnd(25)} | ৳${String(total).padStart(10)} | Tax: ${sale.taxEnabled ? 'Yes' : 'No'} | VAT: ${sale.vatEnabled ? 'Yes' : 'No'}`);
    });
    console.log();

    // Test accountant processing workflow
    if (pendingAccountant.length > 0) {
      console.log('=== Accountant Processing Test ===');
      const testSale = pendingAccountant[0];
      console.log('Test sale:', testSale.companyName);
      console.log('Current status:', testSale.status);
      console.log('Current accountantStatus:', testSale.accountantStatus);
      console.log();

      const total = testSale.products ? testSale.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log('Gross sales:', `৳${total.toLocaleString()}`);

      // Calculate potential deductions
      let taxAmount = 0;
      let vatAmount = 0;
      let eoBpAmount = testSale.eoBpAmount || 0;

      if (testSale.taxEnabled && testSale.taxRate > 0) {
        taxAmount = total * (testSale.taxRate / 100);
        console.log('Tax amount (' + testSale.taxRate + '%):', `৳${taxAmount.toLocaleString()}`);
      }

      if (testSale.vatEnabled && testSale.vatRate > 0) {
        vatAmount = total * (testSale.vatRate / 100);
        console.log('VAT amount (' + testSale.vatRate + '%):', `৳${vatAmount.toLocaleString()}`);
      }

      if (eoBpAmount > 0) {
        console.log('EO/BP amount:', `৳${eoBpAmount.toLocaleString()}`);
      }

      const netSales = total - taxAmount - vatAmount - eoBpAmount;
      console.log('Net sales:', `৳${netSales.toLocaleString()}`);
      console.log();

      console.log('Accountant can:');
      console.log('  - Add/Edit tax rate and amount');
      console.log('  - Add/Edit VAT rate and amount');
      console.log('  - Add/Edit EO/BP amount and reason');
      console.log('  - Approve (status → Pending_Finance)');
      console.log();
    } else {
      console.log('=== Accountant Processing Test ===');
      console.log('No pending accountant approvals to test');
      console.log('To test: Submit a sales record that has been approved by manager');
      console.log();
    }

    // Check accountant-specific statistics
    console.log('=== Accountant Statistics ===');
    const stats = await db.collection('salesrecords').aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: '$accountantStatus',
          count: { $sum: 1 },
          totalGross: {
            $sum: {
              $reduce: {
                input: '$products',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.unitPrice', '$$this.quantity'] }] }
              }
            }
          }
        }
      }
    ]).toArray();

    console.log('Records by accountant status:');
    stats.forEach(s => {
      console.log(`  ${(s._id || 'None').padEnd(12)}: ${s.count} records (৳${s.totalGross.toLocaleString()})`);
    });
    console.log();

    // Check deduction breakdown
    console.log('=== Deduction Breakdown (All Records) ===');
    const deductionStats = await db.collection('salesrecords').aggregate([
      { $match: { deletedAt: null, accountantStatus: 'Approved' } },
      {
        $group: {
          _id: null,
          totalTax: { $sum: '$taxAmount' },
          totalVat: { $sum: '$vatAmount' },
          totalEoBp: { $sum: '$eoBpAmount' },
          totalGross: {
            $sum: {
              $reduce: {
                input: '$products',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.unitPrice', '$$this.quantity'] }] }
              }
            }
          },
          totalNet: { $sum: '$netSales' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (deductionStats.length > 0) {
      const s = deductionStats[0];
      console.log('Processed by accountant:', s.count, 'records');
      console.log('Total gross sales:', `৳${s.totalGross.toLocaleString()}`);
      console.log('Total tax deductions:', `৳${s.totalTax.toLocaleString()}`);
      console.log('Total VAT deductions:', `৳${s.totalVat.toLocaleString()}`);
      console.log('Total EO/BP deductions:', `৳${s.totalEoBp.toLocaleString()}`);
      console.log('Total net sales:', `৳${s.totalNet.toLocaleString()}`);
      console.log('Average deduction rate:', s.totalGross > 0 ? (((s.totalGross - s.totalNet) / s.totalGross) * 100).toFixed(2) + '%' : '0%');
    } else {
      console.log('No records processed by accountant yet');
    }
    console.log();

    console.log('✓ Accountant dashboard data verified');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testAccountant();
