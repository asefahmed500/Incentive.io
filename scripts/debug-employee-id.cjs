/**
 * Debug Employee ID Matching
 * Check if there's an ID mismatch between users and salesrecords
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugEmployeeId() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get Karim's user record
    const karim = await db.collection('users').findOne({
      email: 'karim@incentive.io'
    });

    console.log('=== Karim User Record ===');
    console.log('Name:', karim?.name);
    console.log('Email:', karim?.email);
    console.log('ID:', karim?._id.toString());
    console.log('ID Type:', typeof karim?._id);
    console.log();

    // Get all sales records
    console.log('=== All Sales Records ===');
    const allSales = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .toArray();

    console.log('Total sales records:', allSales.length);
    allSales.forEach((s, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('  Company:', s.companyName);
      console.log('  Status:', s.status);
      console.log('  employeeId:', s.employeeId.toString());
      console.log('  employeeId Type:', typeof s.employeeId);
      console.log('  Matches Karim?', s.employeeId.toString() === karim?._id.toString() ? 'YES' : 'NO');
    });
    console.log();

    // Check for exact match
    console.log('=== Exact Match Check ===');
    const karimsRecords = await db.collection('salesrecords')
      .find({
        employeeId: karim._id,
        deletedAt: null
      })
      .toArray();

    console.log('Records found with exact employeeId match:', karimsRecords.length);
    karimsRecords.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.companyName} | Status: ${s.status}`);
    });
    console.log();

    // Check string match
    console.log('=== String Match Check ===');
    const stringMatchRecords = await db.collection('salesrecords')
      .find({
        deletedAt: null
      })
      .toArray();

    const matchingByString = stringMatchRecords.filter(s =>
      s.employeeId.toString() === karim._id.toString()
    );

    console.log('Records found with string employeeId match:', matchingByString.length);
    matchingByString.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.companyName} | Status: ${s.status} | employeeId: ${s.employeeId.toString()}`);
    });
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

debugEmployeeId();
