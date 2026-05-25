/**
 * Verify Eligibility Calculation
 * Test the aggregation pipeline used for eligibility calculation
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifyEligibility() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get Karim (sales executive)
    const salesExec = await db.collection('users').findOne({
      role: 'salesExecutive',
      email: 'karim@incentive.io'
    });

    if (!salesExec) {
      console.log('✗ Sales Executive not found');
      return;
    }

    console.log('=== User Info ===');
    console.log('Name:', salesExec.name);
    console.log('Email:', salesExec.email);
    console.log('ID:', salesExec._id.toString());
    console.log('Target Amount:', salesExec.targetAmount);
    console.log('Is Eligible:', salesExec.isEligible);
    console.log();

    // Get all sales records for this user
    console.log('=== All Sales Records ===');
    const allRecords = await db.collection('salesrecords')
      .find({
        employeeId: salesExec._id,
        deletedAt: null
      })
      .toArray();

    console.log('Total records:', allRecords.length);
    allRecords.forEach((r, i) => {
      const total = r.products ? r.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log(`  ${i + 1}. ${r.companyName.padEnd(25)} | Status: ${r.status.padEnd(18)} | Amount: ৳${String(total).padStart(10)}`);
    });
    console.log();

    // Get approved records
    console.log('=== Approved Records ===');
    const approvedRecords = await db.collection('salesrecords')
      .find({
        employeeId: salesExec._id,
        status: 'Approved',
        deletedAt: null
      })
      .toArray();

    console.log('Approved records count:', approvedRecords.length);
    let totalApproved = 0;
    approvedRecords.forEach((r, i) => {
      const recordTotal = r.products ? r.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      totalApproved += recordTotal;
      console.log(`  ${i + 1}. ${r.companyName} | ৳${recordTotal.toLocaleString()}`);
      if (r.products) {
        r.products.forEach((p, j) => {
          console.log(`      ${j + 1}. ${p.productName} | ৳${p.unitPrice} × ${p.quantity} = ৳${p.unitPrice * p.quantity}`);
        });
      }
    });
    console.log('Total Approved Sales:', `৳${totalApproved.toLocaleString()}`);
    console.log();

    // Test the aggregation pipeline (same as used in eligibility calculation)
    console.log('=== Aggregation Pipeline Test ===');
    const aggResult = await db.collection('salesrecords')
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

    console.log('Aggregation Result:', aggResult);
    console.log();

    // Calculate eligibility
    const achievement = salesExec.targetAmount > 0 ? (totalApproved / salesExec.targetAmount) * 100 : 0;

    console.log('=== Eligibility Calculation ===');
    console.log('Target Amount:', `৳${salesExec.targetAmount.toLocaleString()}`);
    console.log('Total Approved Sales:', `৳${totalApproved.toLocaleString()}`);
    console.log('Achievement:', achievement.toFixed(2) + '%');
    console.log('Is Eligible (calculated):', achievement >= 50 ? 'Yes' : 'No');
    console.log('Is Eligible (database):', salesExec.isEligible ? 'Yes' : 'No');
    console.log();

    // Verify consistency
    if ((achievement >= 50) !== salesExec.isEligible) {
      console.log('⚠️  INCONSISTENCY DETECTED!');
      console.log('   Calculated eligibility does not match database value');
      console.log('   Achievement:', achievement.toFixed(2) + '%');
      console.log('   Database isEligible:', salesExec.isEligible);
    } else {
      console.log('✓ Eligibility flag is consistent');
    }
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

verifyEligibility();
