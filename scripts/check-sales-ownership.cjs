/**
 * Check Sales Record Ownership
 * Verify which users own the existing sales records
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkSalesOwnership() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get all sales records with user info
    console.log('=== All Sales Records with Owner Info ===');
    const salesRecords = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Total records:', salesRecords.length);
    console.log();

    // Group by employee
    const byEmployee = {};
    salesRecords.forEach(record => {
      const empId = record.employeeId.toString();
      if (!byEmployee[empId]) {
        byEmployee[empId] = [];
      }
      byEmployee[empId].push(record);
    });

    console.log('=== Records by Employee ===');
    const { ObjectId } = require('mongodb');
    for (const [empId, records] of Object.entries(byEmployee)) {
      // Get user info
      const user = await db.collection('users').findOne({
        _id: new ObjectId(empId)
      });

      console.log(`\nEmployee: ${user?.name || 'Unknown'} (${user?.email || 'Unknown'})`);
      console.log('  Role:', user?.role || 'Unknown');
      console.log('  Records:', records.length);

      const byStatus = {};
      records.forEach(r => {
        if (!byStatus[r.status]) byStatus[r.status] = [];
        byStatus[r.status].push(r);
      });

      Object.entries(byStatus).forEach(([status, recs]) => {
        const total = recs.reduce((sum, r) => {
          return sum + (r.products ? r.products.reduce((s, p) => s + (p.unitPrice * p.quantity), 0) : 0);
        }, 0);
        console.log(`    ${status}: ${recs.length} records (৳${total.toLocaleString()})`);
      });
    }

    console.log('\n=== Sales Executives List ===');
    const salesExecs = await db.collection('users')
      .find({ role: 'salesExecutive', isActive: true })
      .limit(10)
      .toArray();

    console.log('Active Sales Executives:', salesExecs.length);
    salesExecs.forEach((se, i) => {
      const recordCount = byEmployee[se._id.toString()] ? byEmployee[se._id.toString()].length : 0;
      console.log(`  ${i + 1}. ${se.name.padEnd(20)} | ${se.email.padEnd(30)} | Records: ${recordCount}`);
    });

    console.log('\n=== Summary ===');
    console.log('Total unique employees with records:', Object.keys(byEmployee).length);
    console.log('Total sales records:', salesRecords.length);

    const statusCounts = {};
    salesRecords.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    console.log('\nStatus breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

checkSalesOwnership();
