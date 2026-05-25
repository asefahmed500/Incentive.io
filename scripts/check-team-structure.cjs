/**
 * Check and Fix Team Structure
 * Verify sales executives are assigned to sales manager
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkTeamStructure() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get sales manager
    const manager = await db.collection('users').findOne({
      role: 'salesManager',
      email: 'jamal@incentive.io'
    });

    console.log('=== Sales Manager ===');
    console.log('Name:', manager?.name);
    console.log('ID:', manager?._id.toString());
    console.log();

    // Get all sales executives
    console.log('=== Sales Executives ===');
    const salesExecs = await db.collection('users')
      .find({
        role: 'salesExecutive',
        isActive: true,
        deletedAt: null
      })
      .project({ name: 1, email: 1, managerId: 1 })
      .toArray();

    console.log('Total sales executives:', salesExecs.length);
    salesExecs.forEach((se, i) => {
      const hasManager = !!se.managerId;
      const isJamalsTeam = se.managerId === manager._id.toString();
      console.log(`  ${i + 1}. ${se.name.padEnd(20)} | ${se.email.padEnd(30)} | Manager: ${hasManager ? (isJamalsTeam ? 'Jamal' : 'Other') : 'None'}`);
    });
    console.log();

    // Count by manager
    const noManager = salesExecs.filter(se => !se.managerId).length;
    const jamalTeam = salesExecs.filter(se => se.managerId === manager._id.toString()).length;
    const otherManager = salesExecs.filter(se => se.managerId && se.managerId !== manager._id.toString()).length;

    console.log('=== Summary ===');
    console.log('No manager assigned:', noManager);
    console.log("Jamal's team:", jamalTeam);
    console.log('Other managers:', otherManager);
    console.log();

    // Check if there's an issue
    if (noManager > 0) {
      console.log('⚠️  ISSUE: Some sales executives have no manager assigned');
      console.log('   Sales managers cannot see team members without managerId set');
      console.log();

      console.log('=== Recommendation ===');
      console.log('Assign sales executives to Jamal (jamal@incentive.io):');
      const unassigned = salesExecs.filter(se => !se.managerId);
      unassigned.forEach(se => {
        console.log(`  - ${se.name} (${se.email})`);
      });
      console.log();

      // Option to fix
      console.log('To fix, run:');
      console.log(`  db.users.updateMany(`);
      console.log(`    { role: 'salesExecutive', managerId: { $exists: false } },`);
      console.log(`    { $set: { managerId: '${manager._id.toString()}' } }`);
      console.log(`  );`);
    } else {
      console.log('✓ All sales executives have managers assigned');
    }
    console.log();

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

checkTeamStructure();
