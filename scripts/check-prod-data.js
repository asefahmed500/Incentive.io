#!/usr/bin/env node

/**
 * Check production database for sales records and related data
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function checkProductionData() {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    // Check sales records
    const salesCount = await db.collection('salesrecords').countDocuments({ deletedAt: null });
    console.log(`\n📊 Sales Records: ${salesCount}`);

    if (salesCount > 0) {
      const sales = await db.collection('salesrecords').find({ deletedAt: null }).limit(3).toArray();
      console.log('\n📋 Sample Sales Records:');
      console.log('─'.repeat(70));
      for (const sale of sales) {
        console.log(`   ID: ${sale._id}`);
        console.log(`   Employee: ${sale.employeeId}`);
        console.log(`   Company: ${sale.companyName || 'N/A'}`);
        console.log(`   Status: ${sale.status}`);
        console.log(`   Total: ৳${sale.totalAmount || 0}`);
        console.log(`   Products: ${sale.products?.length || 0}`);
        console.log('');
      }
      console.log('─'.repeat(70));
    }

    // Check products
    const productsCount = await db.collection('products').countDocuments({ deletedAt: null });
    console.log(`\n📦 Products: ${productsCount}`);

    if (productsCount > 0) {
      const products = await db.collection('products').find({ deletedAt: null }).limit(5).toArray();
      console.log('\n📦 Sample Products:');
      console.log('─'.repeat(70));
      for (const product of products) {
        console.log(`   ${product.name} - ৳${product.unitPrice} - Stock: ${product.stock}`);
      }
      console.log('─'.repeat(70));
    }

    // Check categories
    const categoriesCount = await db.collection('categories').countDocuments({ deletedAt: null });
    console.log(`\n🏷️  Categories: ${categoriesCount}`);

    // Check commission rules
    const rulesCount = await db.collection('commissionrules').countDocuments({ deletedAt: null });
    console.log(`\n📏 Commission Rules: ${rulesCount}`);

    // Check wallets
    const walletsCount = await db.collection('wallets').countDocuments({ deletedAt: null });
    console.log(`\n💰 Wallets: ${walletsCount}`);

    if (walletsCount > 0) {
      const wallets = await db.collection('wallets').find({ deletedAt: null }).limit(5).toArray();
      console.log('\n💰 Sample Wallets:');
      console.log('─'.repeat(70));
      for (const wallet of wallets) {
        console.log(`   Employee: ${wallet.employeeId} - Balance: ৳${wallet.balance}`);
      }
      console.log('─'.repeat(70));
    }

    // Check notifications
    const notificationsCount = await db.collection('notifications').countDocuments({ deletedAt: null });
    console.log(`\n🔔 Notifications: ${notificationsCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkProductionData().catch(console.error);
