#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * Tests all 6 user roles with correct credentials
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test credentials for all 6 roles
const testUsers = [
  { email: 'karim@incentive.io', password: 'Jamal123!', role: 'salesExecutive', expectedPath: '/sales-dashboard' },
  { email: 'manager@incentive.io', password: 'Manager123!', role: 'salesManager', expectedPath: '/sales-manager' },
  { email: 'accountant@incentive.io', password: 'Accountant123!', role: 'accountant', expectedPath: '/accountant' },
  { email: 'finance@incentive.io', password: 'Finance123!', role: 'finance', expectedPath: '/finance' },
  { email: 'admin@incentive.io', password: 'Admin123!', role: 'admin', expectedPath: '/admin' },
  { email: 'superadmin@incentive.io', password: 'Superadmin123!', role: 'administrator', expectedPath: '/administrator' },
];

// Results tracking
const results = {
  passed: [],
  failed: [],
  errors: []
};

async function testLogin(user) {
  return new Promise((resolve) => {
    console.log(`\n🔐 Testing ${user.role} login...`);

    const testScript = `
      const emailInput = document.querySelector('input[name="email"]');
      const passwordInput = document.querySelector('input[name="password"]');
      const form = document.querySelector('form');

      if (!emailInput || !passwordInput || !form) {
        console.log('ERROR: Form elements not found');
        process.exit(1);
      }

      emailInput.value = '${user.email}';
      passwordInput.value = '${user.password}';
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      // Wait for redirect and check result
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (currentPath.includes('${user.expectedPath}') || currentPath.startsWith('${user.expectedPath}')) {
          console.log('SUCCESS: Redirected to ' + currentPath);
          process.exit(0);
        } else {
          console.log('FAILED: Expected ${user.expectedPath}, got ' + currentPath);
          process.exit(1);
        }
      }, 3000);
    `;

    const agent = spawn('npx', ['agent-browser', 'open', 'http://localhost:3000/login', '--eval', testScript, '--wait', '5'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    agent.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      if (text.includes('SUCCESS') || text.includes('FAILED') || text.includes('ERROR')) {
        console.log(`  ${text.trim()}`);
      }
    });

    agent.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    agent.on('close', (code) => {
      if (output.includes('SUCCESS')) {
        console.log(`✅ ${user.role} login PASSED`);
        results.passed.push(user.role);
        resolve(true);
      } else if (output.includes('FAILED')) {
        console.log(`❌ ${user.role} login FAILED`);
        results.failed.push({ role: user.role, reason: output });
        resolve(false);
      } else {
        console.log(`⚠️  ${user.role} login ERROR (exit code ${code})`);
        results.errors.push({ role: user.role, error: errorOutput || output });
        resolve(false);
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      agent.kill();
      console.log(`⏱️  ${user.role} login TIMED OUT`);
      results.errors.push({ role: user.role, error: 'Timeout after 15 seconds' });
      resolve(false);
    }, 15000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Authentication Tests for All 6 Roles');
  console.log('='.repeat(60));

  // Check if dev server is running
  console.log('\n📡 Checking if dev server is running...');
  try {
    const response = await fetch('http://localhost:3000/login');
    if (!response.ok) throw new Error('Server not responding');
    console.log('✅ Dev server is running\n');
  } catch (error) {
    console.log('❌ Dev server is not running. Please start it with: npm run dev');
    process.exit(1);
  }

  // Run tests sequentially to avoid session conflicts
  for (const user of testUsers) {
    await testLogin(user);
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}/${testUsers.length}`);
  console.log(`❌ Failed: ${results.failed.length}/${testUsers.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}/${testUsers.length}`);

  if (results.passed.length > 0) {
    console.log('\n✅ Successful logins:');
    results.passed.forEach(role => console.log(`  - ${role}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed logins:');
    results.failed.forEach(({ role, reason }) => {
      console.log(`  - ${role}: ${reason}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Error logins:');
    results.errors.forEach(({ role, error }) => {
      console.log(`  - ${role}: ${error}`);
    });
  }

  // Save results to file
  const resultsPath = path.join(__dirname, '../tests/e2e/results', 'auth-results.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);

  // Exit with appropriate code
  const allPassed = results.failed.length === 0 && results.errors.length === 0;
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
  console.error('💀 Fatal error:', error);
  process.exit(1);
});
