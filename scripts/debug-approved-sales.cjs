/**
 * Debug Approved Sales Calculation
 * Investigate why approved sales aggregation returns 0
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugApprovedSales() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get sales executive
    const salesExec = await db.collection('users').findOne({
      role: 'salesExecutive',
      email: 'karim@incentive.io'
    });

    if (!salesExec) {
      console.log('✗ Sales Executive not found');
      return;
    }

    console.log('=== Sales Executive ===');
    console.log('ID:', salesExec._id.toString());
    console.log('Name:', salesExec.name);
    console.log();

    // Get all approved sales records
    console.log('=== All Approved Sales Records ===');
    const approvedRecords = await db.collection('salesrecords')
      .find({
        employeeId: salesExec._id,
        status: 'Approved',
        deletedAt: null
      })
      .toArray();

    console.log('Count:', approvedRecords.length);
    console.log();

    if (approvedRecords.length === 0) {
      console.log('No approved sales records found for this user.');
      console.log();
      console.log('=== Checking All Sales Records ===');
      const allRecords = await db.collection('salesrecords')
        .find({
          employeeId: salesExec._id,
          deletedAt: null
        })
        .toArray();

      console.log('Total records for this user:', allRecords.length);
      allRecords.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.companyName} | Status: ${r.status} | Employee ID Match: ${r.employeeId.toString() === salesExec._id.toString() ? 'Yes' : 'No'}`);
      });
      console.log();
      return;
    }

    approvedRecords.forEach((r, i) => {
      console.log(`Record ${i + 1}: ${r.companyName}`);
      console.log('  Status:', r.status);
      console.log('  Employee ID:', r.employeeId.toString());
      console.log('  Products:', r.products ? r.products.length : 0);
      if (r.products && r.products.length > 0) {
        r.products.forEach((p, j) => {
          const productTotal = (p.unitPrice || 0) * (p.quantity || 0);
          console.log(`    ${j + 1}. ${p.productName} | Price: ${p.unitPrice} | Qty: ${p.quantity} | Total: ${productTotal}`);
        });
        const recordTotal = r.products.reduce((sum, p) => sum + ((p.unitPrice || 0) * (p.quantity || 0)), 0);
        console.log('  Record Total:', recordTotal);
      }
      console.log();
    });

    // Test aggregation
    console.log('=== Testing Aggregation Pipeline ===');
    const aggregationResult = await db.collection('salesrecords')
      .aggregate([
        {
          $match: {
            employeeId: salesExec._id,
            status: 'Approved',
            deletedAt: null
          }
        },
        {
          $addFields: {
            totalAmount: {
              $reduce: {
                input: '$products',
                initialValue: 0,
                in: { $add: ['$$value', { $multiply: ['$$this.unitPrice', '$$this.quantity'] }] }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    console.log('Aggregation Result:', aggregationResult);
    console.log();

    // Alternative aggregation - simpler approach
    console.log('=== Alternative Aggregation (Unwind) ===');
    const altResult = await db.collection('salesrecords')
      .aggregate([
        {
          $match: {
            employeeId: salesExec._id,
            status: 'Approved',
            deletedAt: null
          }
        },
        { $unwind: '$products' },
        {
          $group: {
            _id: '$_id',
            total: {
              $sum: { $multiply: ['$products.unitPrice', '$products.quantity'] }
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
            count: { $sum: 1 }
          }
        }
      ])
      .toArray();

    console.log('Alternative Result:', altResult);
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

debugApprovedSales();
