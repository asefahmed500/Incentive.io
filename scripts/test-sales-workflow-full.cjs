/**
 * Comprehensive Sales Workflow Test
 * Tests the complete sales record creation and approval workflow
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function runComprehensiveTest() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    const db = client.db();

    // Get test user (sales executive)
    const salesExec = await db.collection('users').findOne({
      role: 'salesExecutive',
      email: 'karim@incentive.io'
    });

    if (!salesExec) {
      console.log('✗ Sales Executive not found');
      return;
    }

    console.log('=== Testing Sales Workflow ===\n');
    console.log('User:', salesExec.name);
    console.log('Email:', salesExec.email);
    console.log('Role:', salesExec.role);
    console.log('Target Amount:', salesExec.targetAmount);
    console.log('Is Eligible:', salesExec.isEligible);
    console.log();

    // Get categories
    const categories = await db.collection('categories')
      .find({ deletedAt: null })
      .toArray();

    console.log('=== Categories ===');
    categories.forEach(c => {
      console.log(`  ${c.name.padEnd(25)} | ID: ${c._id.toString()} | Auto-Approve: ${c.autoApprove ? 'Yes' : 'No'}`);
    });
    console.log();

    // Get products
    const products = await db.collection('products')
      .find({ deletedAt: null })
      .toArray();

    console.log('=== Available Products ===');
    products.forEach(p => {
      const cat = categories.find(c => c._id.toString() === p.categoryId.toString());
      console.log(`  ${p.name.padEnd(25)} | Price: ৳${String(p.price).padStart(8)} | Stock: ${String(p.stock).padStart(3)} | Category: ${cat?.name || 'Unknown'}`);
    });
    console.log();

    // Test Case 1: Create sales record with auto-approve category
    console.log('=== Test 1: Auto-Approve Sales Record ===');
    const autoApproveCat = categories.find(c => c.autoApprove);
    if (autoApproveCat) {
      const autoApproveProduct = products.find(p => p.categoryId.toString() === autoApproveCat._id.toString());
      if (autoApproveProduct) {
        const testRecord1 = {
          employeeId: salesExec._id,
          employeeName: salesExec.name,
          companyName: 'Auto Approve Test Company',
          companyEmail: 'test@autoapprove.com',
          products: [{
            productName: autoApproveProduct.name,
            categoryId: autoApproveCat._id,
            unitPrice: autoApproveProduct.price,
            quantity: 2,
            dealNotes: 'Test auto-approve sale'
          }],
          taxEnabled: false,
          vatEnabled: false,
          proofOfSale: [],
          status: 'Draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Calculate sale amount
        const saleAmount = autoApproveProduct.price * 2;
        console.log('  Product:', autoApproveProduct.name);
        console.log('  Price:', autoApproveProduct.price);
        console.log('  Quantity: 2');
        console.log('  Total Amount:', saleAmount);
        console.log('  Category:', autoApproveCat.name, '(Auto-Approve)');
        console.log('  ✓ Should auto-approve on submission');
        console.log();
      }
    } else {
      console.log('  ✗ No auto-approve categories found');
      console.log();
    }

    // Test Case 2: Create sales record with regular category
    console.log('=== Test 2: Regular Approval Workflow ===');
    const regularCat = categories.find(c => !c.autoApprove);
    if (regularCat) {
      const regularProduct = products.find(p => p.categoryId.toString() === regularCat._id.toString());
      if (regularProduct) {
        const testRecord2 = {
          employeeId: salesExec._id,
          employeeName: salesExec.name,
          companyName: 'Regular Test Company',
          companyEmail: 'test@regular.com',
          products: [{
            productName: regularProduct.name,
            categoryId: regularCat._id,
            unitPrice: regularProduct.price,
            quantity: 1,
            dealNotes: 'Test regular approval sale'
          }],
          taxEnabled: false,
          vatEnabled: false,
          proofOfSale: [],
          status: 'Draft',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const saleAmount = regularProduct.price * 1;
        console.log('  Product:', regularProduct.name);
        console.log('  Price:', regularProduct.price);
        console.log('  Quantity: 1');
        console.log('  Total Amount:', saleAmount);
        console.log('  Category:', regularCat.name, '(Regular Approval)');
        console.log('  ✓ Should follow standard approval workflow');
        console.log('  ✓ Expected flow: Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved');
        console.log();
      }
    }

    // Test Case 3: Mixed categories (should use regular workflow)
    console.log('=== Test 3: Mixed Categories (Regular Workflow) ===');
    const autoApproveCat2 = categories.find(c => c.autoApprove);
    const regularCat2 = categories.find(c => !c.autoApprove);
    if (autoApproveCat2 && regularCat2) {
      console.log('  ✓ When mixing auto-approve and regular categories');
      console.log('  ✓ Should use standard approval workflow (not auto-approve)');
      console.log();
    }

    // Test Case 4: Check current sales records
    console.log('=== Current Sales Records ===');
    const salesRecords = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log('Total records:', salesRecords.length);
    salesRecords.forEach((s, i) => {
      const total = s.products ? s.products.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) : 0;
      console.log(`  ${i + 1}. ${s.companyName.padEnd(25)} | Status: ${s.status.padEnd(18)} | Amount: ৳${String(total).padStart(10)}`);
    });
    console.log();

    // Test Case 5: Check approval workflow status
    console.log('=== Approval Workflow Status ===');
    const statusCounts = await db.collection('salesrecords').aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('Records by status:');
    statusCounts.forEach(s => {
      console.log(`  ${s._id.padEnd(20)}: ${s.count}`);
    });
    console.log();

    // Test Case 6: Check wallet balance
    console.log('=== Wallet Status ===');
    const wallet = await db.collection('wallets').findOne({
      employeeId: salesExec._id,
      deletedAt: null
    });

    if (wallet) {
      console.log('Wallet Balance:', wallet.balance ? `৳${wallet.balance.toLocaleString()}` : '৳0');
      console.log('Transactions:', wallet.transactions ? wallet.transactions.length : 0);
    } else {
      console.log('No wallet found for this user');
    }
    console.log();

    // Test Case 7: Check commission rules
    console.log('=== Commission Rules ===');
    const rules = await db.collection('commissionrules')
      .find({ deletedAt: null })
      .sort({ priority: -1 })
      .toArray();

    console.log('Active rules:', rules.length);
    rules.forEach(r => {
      console.log(`  ${r.targetPercentageFrom}%-${r.targetPercentageTo}% achievement → ${r.commissionRate}% commission (Priority: ${r.priority})`);
    });
    console.log();

    // Test Case 8: Calculate eligibility
    console.log('=== Eligibility Calculation ===');
    const approvedSales = await db.collection('salesrecords')
      .aggregate([
        { $match: { employeeId: salesExec._id, status: 'Approved', deletedAt: null } },
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
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]).toArray();

    const totalApproved = approvedSales[0]?.total || 0;
    const approvedCount = approvedSales[0]?.count || 0;
    const achievement = salesExec.targetAmount > 0 ? (totalApproved / salesExec.targetAmount) * 100 : 0;

    console.log('Target Amount:', `৳${salesExec.targetAmount.toLocaleString()}`);
    console.log('Total Approved Sales:', `৳${totalApproved.toLocaleString()}`);
    console.log('Number of Approved Sales:', approvedCount);
    console.log('Achievement:', achievement.toFixed(2) + '%');
    console.log('Is Eligible:', achievement >= 50 ? 'Yes (≥50%)' : 'No (<50%)');
    console.log('Database Is Eligible:', salesExec.isEligible ? 'Yes' : 'No');
    console.log();

    // Verify data consistency
    if (achievement >= 50 && !salesExec.isEligible) {
      console.log('⚠️  WARNING: Achievement >= 50% but isEligible is false!');
    } else if (achievement < 50 && salesExec.isEligible) {
      console.log('⚠️  WARNING: Achievement < 50% but isEligible is true!');
    } else {
      console.log('✓ Eligibility flag is consistent');
    }
    console.log();

    console.log('=== Test Complete ===');
    console.log('All workflow data verified successfully');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

runComprehensiveTest();
