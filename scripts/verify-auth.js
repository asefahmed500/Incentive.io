#!/usr/bin/env node

/**
 * Manual Authentication Verification Script
 * Tests all 6 roles and verifies correct redirects
 */

import { connectToDatabase } from '../lib/mongodb.js';
import { User } from '../lib/models/User.js';
import { hashPassword, verifyPassword } from '../lib/utils/password.js';

const testUsers = [
  { email: 'admin@incentive.io', password: 'Admin123!', role: 'admin', expectedPath: '/admin' },
  { email: 'superadmin@incentive.io', password: 'Superadmin123!', role: 'administrator', expectedPath: '/administrator' },
  { email: 'jamal@incentive.io', password: 'Manager123!', role: 'salesManager', expectedPath: '/sales-manager' },
  { email: 'accountant@incentive.io', password: 'Accountant123!', role: 'accountant', expectedPath: '/accountant' },
  { email: 'finance@incentive.io', password: 'Finance123!', role: 'finance', expectedPath: '/finance' },
  { email: 'karim@incentive.io', password: 'Executive123!', role: 'salesExecutive', expectedPath: '/sales-dashboard' },
];

async function verifyAuthentication() {
  console.log('🔐 Authentication Verification');
  console.log('=' .repeat(60));

  await connectToDatabase();

  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    console.log(`\nTesting ${user.role}...`);

    try {
      // Find user in database
      const dbUser = await User.findOne({ email: user.email, deletedAt: null });

      if (!dbUser) {
        console.log(`❌ User not found in database: ${user.email}`);
        failed++;
        continue;
      }

      // Verify password
      const isValid = await verifyPassword(user.password, dbUser.password);

      if (!isValid) {
        console.log(`❌ Password verification failed for: ${user.email}`);
        failed++;
        continue;
      }

      // Check role
      if (dbUser.role !== user.role) {
        console.log(`❌ Role mismatch for ${user.email}: expected ${user.role}, got ${dbUser.role}`);
        failed++;
        continue;
      }

      // Check if user is active
      if (!dbUser.isActive) {
        console.log(`❌ User is inactive: ${user.email}`);
        failed++;
        continue;
      }

      console.log(`✅ ${user.role} authentication verified`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Active: ${dbUser.isActive}`);
      console.log(`   Expected redirect: ${user.expectedPath}`);
      passed++;

    } catch (error) {
      console.log(`❌ Error testing ${user.role}: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${testUsers.length}`);
  console.log(`❌ Failed: ${failed}/${testUsers.length}`);

  if (passed === testUsers.length) {
    console.log('\n✅ All authentication tests passed!');
    console.log('\n🌐 Manual browser test instructions:');
    console.log('1. Open http://localhost:3000/login in browser');
    console.log('2. Test each role with credentials above');
    console.log('3. Verify correct redirects after login');
  } else {
    console.log('\n❌ Some authentication tests failed. Check errors above.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

verifyAuthentication().catch(error => {
  console.error('💀 Fatal error:', error);
  process.exit(1);
});
