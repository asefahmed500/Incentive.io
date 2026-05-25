#!/usr/bin/env node

/**
 * Check detailed sales record data including product prices
 */

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio";

async function checkSalesDetails() {
  const { MongoClient } = await import('mongodb');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const dbName = new URL(client.options.srvHost ? `mongodb+srv://${client.options.srvHost}` : MONGODB_URI).pathname.slice(1) || 'incentiveio';
    const db = client.db(dbName);

    const sales = await db.collection('salesrecords').find({ deletedAt: null }).limit(3).toArray();

    console.log('\n📋 Detailed Sales Records Analysis:');
    console.log('═'.repeat(80));

    for (const sale of sales) {
      console.log(`\n🏢 Company: ${sale.companyName}`);
      console.log(`   Employee ID: ${sale.employeeId}`);
      console.log(`   Status: ${sale.status}`);
      console.log(`   Net Sales: ৳${sale.netSales || 0}`);
      console.log(`   Products (${sale.products?.length || 0}):`);

      if (sale.products && sale.products.length > 0) {
        let total = 0;
        for (const product of sale.products) {
          const lineTotal = (product.unitPrice || 0) * (product.quantity || 0);
          total += lineTotal;
          console.log(`      - ${product.productName}`);
          console.log(`        Unit Price: ৳${product.unitPrice || 'MISSING'} × ${product.quantity || 1} = ৳${lineTotal}`);
        }
        console.log(`   💰 CALCULATED TOTAL: ৳${total}`);
      } else {
        console.log(`   ⚠️  NO PRODUCTS FOUND`);
      }
      console.log('─'.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

checkSalesDetails().catch(console.error);
