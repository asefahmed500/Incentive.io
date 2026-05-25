/**
 * Check Finance Status for Eligibility
 * Verify the financeStatus field used in eligibility calculation
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkFinanceStatus() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get Karim
    const karim = await db.collection('users').findOne({
      email: 'karim@incentive.io'
    });

    console.log('=== User Info ===');
    console.log('Name:', karim?.name);
    console.log('Target Amount:', karim?.targetAmount);
    console.log('Is Eligible:', karim?.isEligible);
    console.log();

    // Get all sales records with both status fields
    console.log('=== Sales Records (Status vs Finance Status) ===');
    const records = await db.collection('salesrecords')
      .find({
        employeeId: karim._id.toString(),
        deletedAt: null
      })
      .project({
        companyName: 1,
        status: 1,
        financeStatus: 1,
        products: 1
      })
      .toArray();

    console.log('Total records:', records.length);
    records.forEach((r, i) => {
      const total = r.products ? r.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log(`  ${i + 1}. ${r.companyName.padEnd(25)} | status: ${r.status.padEnd(18)} | financeStatus: ${r.financeStatus.padEnd(10)} | ৳${String(total).padStart(10)}`);
    });
    console.log();

    // Check eligibility calculation (using financeStatus: "Approved")
    console.log('=== Eligibility Calculation (Using financeStatus) ===');
    const financeApprovedRecords = await db.collection('salesrecords')
      .find({
        employeeId: karim._id.toString(),
        financeStatus: 'Approved',
        deletedAt: null
      })
      .toArray();

    console.log('Records with financeStatus: "Approved":', financeApprovedRecords.length);
    let totalForEligibility = 0;
    financeApprovedRecords.forEach((r, i) => {
      const total = r.products ? r.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      totalForEligibility += total;
      console.log(`  ${i + 1}. ${r.companyName} | ৳${total.toLocaleString()}`);
    });
    console.log('Total for eligibility:', `৳${totalForEligibility.toLocaleString()}`);
    console.log();

    const achievement = karim.targetAmount > 0 ? (totalForEligibility / karim.targetAmount) * 100 : 0;
    console.log('Achievement:', achievement.toFixed(2) + '%');
    console.log('Is Eligible (>= 50%):', achievement >= 50 ? 'Yes' : 'No');
    console.log('Database isEligible:', karim.isEligible ? 'Yes' : 'No');
    console.log();

    // Check all status combinations
    console.log('=== All Status Combinations ===');
    const allRecords = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .project({
        companyName: 1,
        status: 1,
        financeStatus: 1,
        employeeId: 1
      })
      .toArray();

    const combinations = {};
    allRecords.forEach(r => {
      const key = `status: ${r.status} | financeStatus: ${r.financeStatus}`;
      if (!combinations[key]) combinations[key] = [];
      combinations[key].push(r.companyName);
    });

    Object.entries(combinations).forEach(([key, companies]) => {
      console.log(`  ${key}: ${companies.length} records`);
      companies.slice(0, 2).forEach(c => console.log(`    - ${c}`));
      if (companies.length > 2) console.log(`    ... and ${companies.length - 2} more`);
    });
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

checkFinanceStatus();
