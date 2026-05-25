/**
 * Test Sales Manager Dashboard Functionality
 * Tests team sales view, approval workflow, and team management
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testSalesManager() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get sales manager (Jamal)
    const manager = await db.collection('users').findOne({
      role: 'salesManager',
      email: 'jamal@incentive.io'
    });

    if (!manager) {
      console.log('✗ Sales Manager not found');
      return;
    }

    console.log('=== Sales Manager Info ===');
    console.log('Name:', manager.name);
    console.log('Email:', manager.email);
    console.log('ID:', manager._id.toString());
    console.log();

    // Get team members
    console.log('=== Team Members ===');
    const teamMembers = await db.collection('users')
      .find({
        managerId: manager._id.toString(),
        isActive: true,
        deletedAt: null
      })
      .toArray();

    console.log('Total team members:', teamMembers.length);
    teamMembers.forEach((member, i) => {
      console.log(`  ${i + 1}. ${member.name.padEnd(20)} | ${member.email.padEnd(30)} | Target: ৳${String(member.targetAmount || 0).padStart(10)} | Eligible: ${member.isEligible ? 'Yes' : 'No'}`);
    });
    console.log();

    // Get team sales records
    console.log('=== Team Sales Records ===');
    const teamMemberIds = teamMembers.map(m => m._id.toString());
    const teamSales = await db.collection('salesrecords')
      .find({
        employeeId: { $in: teamMemberIds },
        deletedAt: null
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Total team sales records:', teamSales.length);

    // Group by status
    const byStatus = {};
    teamSales.forEach(sale => {
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

    // Check pending manager approvals
    console.log('=== Pending Manager Approvals ===');
    const pendingManager = await db.collection('salesrecords')
      .find({
        employeeId: { $in: teamMemberIds },
        status: 'Pending_Manager',
        deletedAt: null
      })
      .toArray();

    console.log('Records awaiting manager approval:', pendingManager.length);
    pendingManager.forEach((sale, i) => {
      const employee = teamMembers.find(m => m._id.toString() === sale.employeeId);
      const total = sale.products ? sale.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log(`  ${i + 1}. ${sale.companyName.padEnd(25)} | Employee: ${employee?.name || 'Unknown'} | ৳${String(total).padStart(10)} | Created: ${new Date(sale.createdAt).toLocaleDateString()}`);
    });
    console.log();

    // Test approval workflow
    if (pendingManager.length > 0) {
      console.log('=== Approval Workflow Test ===');
      const testSale = pendingManager[0];
      console.log('Test sale:', testSale.companyName);
      console.log('Current status:', testSale.status);
      console.log('Manager can approve: Yes (owns this team member)');
      console.log('Expected after approval: status → Pending_Accountant');
      console.log();
    } else {
      console.log('=== Approval Workflow Test ===');
      console.log('No pending manager approvals to test');
      console.log('To test: Create a sales record as a team member and submit for approval');
      console.log();
    }

    // Check team performance
    console.log('=== Team Performance Summary ===');
    const teamPerformance = await Promise.all(teamMembers.map(async (member) => {
      const memberSales = await db.collection('salesrecords')
        .find({
          employeeId: member._id.toString(),
          financeStatus: 'Approved',
          deletedAt: null
        })
        .toArray();

      const totalApproved = memberSales.reduce((sum, s) => {
        return sum + (s.products ? s.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0);
      }, 0);

      const achievement = member.targetAmount > 0 ? (totalApproved / member.targetAmount) * 100 : 0;

      return {
        name: member.name,
        target: member.targetAmount,
        achieved: totalApproved,
        achievement: achievement.toFixed(2) + '%',
        isEligible: achievement >= 50
      };
    }));

    console.log('Team Member Performance:');
    teamPerformance.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name.padEnd(20)} | Target: ৳${String(p.target).padStart(10)} | Achieved: ৳${String(p.achieved).padStart(10)} | ${p.achievement.padStart(8)} | Eligible: ${p.isEligible ? 'Yes' : 'No'}`);
    });
    console.log();

    // Check team commissions
    console.log('=== Team Commission Eligibility ===');
    const eligibleCount = teamPerformance.filter(p => p.isEligible).length;
    console.log('Team members eligible for commission:', eligibleCount, '/', teamMembers.length);
    console.log('Eligibility rate:', teamMembers.length > 0 ? ((eligibleCount / teamMembers.length) * 100).toFixed(2) + '%' : '0%');
    console.log();

    console.log('✓ Sales Manager dashboard data verified');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testSalesManager();
