#!/usr/bin/env node

/**
 * Check categories and auto-approve configuration
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function checkCategories() {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    const categories = await db.collection('categories').find({ deletedAt: null }).toArray();

    console.log('\n🏷️  Categories Configuration:');
    console.log('═'.repeat(80));

    for (const category of categories) {
      const autoApprove = category.autoApprove ? '✅ YES' : '❌ NO';
      console.log(`\n📦 ${category.name}`);
      console.log(`   ID: ${category._id}`);
      console.log(`   Auto-Approve: ${autoApprove}`);
      console.log(`   Description: ${category.description || 'No description'}`);
    }

    console.log('\n═'.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Categories: ${categories.length}`);
    console.log(`   Auto-Approve Enabled: ${categories.filter(c => c.autoApprove).length}`);
    console.log(`   Standard Workflow: ${categories.filter(c => !c.autoApprove).length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkCategories().catch(console.error);
