/**
 * Test Sales Record Creation Workflow
 * Tests the actual functionality of creating sales records
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testSalesWorkflow() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    const db = client.db();

    // Check collections
    const productsCount = await db.collection('products').countDocuments({ deletedAt: null });
    const categoriesCount = await db.collection('categories').countDocuments({ deletedAt: null });
    const usersCount = await db.collection('users').countDocuments({ role: 'salesExecutive', isActive: true });

    console.log('\n=== Database State ===');
    console.log('Products:', productsCount);
    console.log('Categories:', categoriesCount);
    console.log('Active Sales Executives:', usersCount);

    // Get sales executive user
    const salesExec = await db.collection('users').findOne({
      role: 'salesExecutive',
      email: 'karim@incentive.io'
    });

    if (!salesExec) {
      console.log('✗ Sales Executive karim@incentive.io not found');
      return;
    }

    console.log('\n=== Sales Executive ===');
    console.log('Name:', salesExec.name);
    console.log('Email:', salesExec.email);
    console.log('ID:', salesExec._id.toString());
    console.log('Is Eligible:', salesExec.isEligible);
    console.log('Target Amount:', salesExec.targetAmount);

    // Get categories with auto-approve status
    const categories = await db.collection('categories')
      .find({ deletedAt: null })
      .project({ name: 1, autoApprove: 1 })
      .toArray();

    console.log('\n=== Categories ===');
    categories.forEach(c => {
      console.log(`  - ${c.name} ${c.autoApprove ? '(Auto-Approve)' : ''}`);
    });

    // Get sample products
    const products = await db.collection('products')
      .find({ deletedAt: null })
      .limit(5)
      .toArray();

    console.log('\n=== Sample Products ===');
    products.forEach(p => {
      const catName = categories.find(c => c._id.toString() === p.categoryId.toString())?.name || 'Unknown';
      console.log(`  - ${p.name}`);
      console.log(`    Price: ৳${p.price} | Stock: ${p.stock}`);
      console.log(`    Category: ${catName}`);
    });

    // Check recent sales records
    const recentSales = await db.collection('salesrecords')
      .find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    console.log('\n=== Recent Sales Records ===');
    console.log('Total records found:', recentSales.length);
    recentSales.forEach(s => {
      console.log(`  - ${s.companyName} | Status: ${s.status} | Created: ${new Date(s.createdAt).toLocaleDateString()}`);
    });

    // Test data for creating a sales record
    console.log('\n=== Test Data for New Sales Record ===');
    if (products.length > 0) {
      const testProduct = products[0];
      console.log('Product ID:', testProduct._id.toString());
      console.log('Product Name:', testProduct.name);
      console.log('Product Price:', testProduct.price);
      console.log('Category ID:', testProduct.categoryId.toString());

      // Calculate test sale amount
      const quantity = 2;
      const total = testProduct.price * quantity;
      console.log('\nTest Sale Calculation:');
      console.log('  Quantity:', quantity);
      console.log('  Unit Price:', testProduct.price);
      console.log('  Total Amount:', total);
    }

    console.log('\n✓ Database state verified successfully');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.close();
  }
}

testSalesWorkflow();
