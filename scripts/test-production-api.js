#!/usr/bin/env node

/**
 * Comprehensive Production API Testing Script
 * Tests all critical endpoints and functionality
 */

const BASE_URL = "https://incentiveio.vercel.app";

async function testAPI() {
  console.log('🧪 Testing Production API Endpoints');
  console.log('═'.repeat(80));

  const tests = [
    {
      name: "Health Check",
      url: "/api/health",
      method: "GET",
      expectStatus: 200,
    },
    {
      name: "Login Page",
      url: "/login",
      method: "GET",
      expectStatus: 200,
    },
    {
      name: "Register Page",
      url: "/register",
      method: "GET",
      expectStatus: 200,
    },
    {
      name: "Sales Dashboard (Protected)",
      url: "/sales-dashboard",
      method: "GET",
      expectStatus: 307, // Redirect to login
    },
    {
      name: "Sales Manager (Protected)",
      url: "/sales-manager",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Accountant (Protected)",
      url: "/accountant",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Finance (Protected)",
      url: "/finance",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Admin (Protected)",
      url: "/admin",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Administrator (Protected)",
      url: "/administrator",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Sales Dashboard Records (Protected)",
      url: "/sales-dashboard/records",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Sales Dashboard Wallet (Protected)",
      url: "/sales-dashboard/wallet",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "Sales Dashboard Add Record (Protected)",
      url: "/sales-dashboard/add-record",
      method: "GET",
      expectStatus: 307,
    },
    {
      name: "API Health (Alternative)",
      url: "/api/health",
      method: "GET",
      expectStatus: 200,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        redirect: "manual",
      });

      const status = response.status;
      const passedTest = status === test.expectStatus;

      if (passedTest) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${status} (expected ${test.expectStatus})`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Status: ${status} (expected ${test.expectStatus})`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log('═'.repeat(80));

  // Check database connectivity via health endpoint
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('\n🏥 Database Health:');
    console.log(`   Connected: ${healthData.database?.connected ? '✅' : '❌'}`);
    console.log(`   Message: ${healthData.database?.message || 'N/A'}`);
    console.log(`   Latency: ${healthData.database?.latency || 0}ms`);
  } catch (error) {
    console.log('\n❌ Failed to fetch health data');
  }
}

testAPI().catch(console.error);
