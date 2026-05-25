#!/usr/bin/env node

/**
 * Check product data structure
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function checkProducts() {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    const products = await db.collection('products').find({ deletedAt: null }).limit(10).toArray();

    console.log('\n📦 Product Data Structure:');
    console.log('═'.repeat(80));

    for (const product of products) {
      console.log(`\n🏷️  ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price Field: ${product.price !== undefined ? '৳' + product.price : 'MISSING'}`);
      console.log(`   UnitPrice Field: ${product.unitPrice !== undefined ? '৳' + product.unitPrice : 'NOT IN SCHEMA'}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Category ID: ${product.categoryId}`);
      console.log(`   All Fields:`, Object.keys(product).join(', '));
    }
    console.log('\n═'.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkProducts().catch(console.error);
