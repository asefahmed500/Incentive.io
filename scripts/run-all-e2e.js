/**
 * run-all-e2e.js — Master E2E Runner
 *
 * Runs all role-specific E2E scripts sequentially in the correct order:
 *   1. admin-e2e.js       — Admin sets up commission rules, categories, products, targets
 *   2. executive-e2e.js   — Sales Executive submits a record
 *   3. manager-e2e.js     — Sales Manager approves the record
 *   4. accountant-e2e.js  — Accountant processes deductions & forwards to Finance
 *   5. finance-e2e.js     — Finance gives final approval (wallet credited)
 *   6. verify-e2e.js      — Executive verifies Approved status, wallet balance, notifications
 *   7. rejection-e2e.js   — Full rejection workflow (seeds fresh DB, submits → rejects → verifies Draft)
 *
 * Prerequisites:
 *   - Next.js dev server must be running: npm run dev
 *   - MongoDB must be running locally
 *
 * Usage:
 *   node scripts/run-all-e2e.js
 */

import { execSync, spawnSync } from "child_process";

const SCRIPTS = [
  { name: "Admin Setup",               file: "scripts/admin-e2e.js" },
  { name: "Executive Submission",      file: "scripts/executive-e2e.js" },
  { name: "Manager Approval",          file: "scripts/manager-e2e.js" },
  { name: "Accountant Processing",     file: "scripts/accountant-e2e.js" },
  { name: "Finance Final Approval",    file: "scripts/finance-e2e.js" },
  { name: "Executive Verification",    file: "scripts/verify-e2e.js" },
  { name: "Rejection Workflow",        file: "scripts/rejection-e2e.js" },
];

const results = [];

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║       Incentive.io — Full E2E Multi-Role Test Suite          ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`\nRunning ${SCRIPTS.length} role-specific scripts sequentially...\n`);

for (const script of SCRIPTS) {
  console.log(`\n${"─".repeat(65)}`);
  console.log(`▶  Running: ${script.name}`);
  console.log(`   File:    ${script.file}`);
  console.log(`${"─".repeat(65)}`);

  const start = Date.now();

  const result = spawnSync("node", [script.file], {
    stdio: "inherit",
    encoding: "utf-8",
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const passed = result.status === 0;

  results.push({
    name: script.name,
    file: script.file,
    passed,
    elapsed,
    exitCode: result.status,
  });

  if (passed) {
    console.log(`\n✅  PASSED: ${script.name} (${elapsed}s)`);
  } else {
    console.log(`\n❌  FAILED: ${script.name} (${elapsed}s) — exit code ${result.status}`);
    console.log("    ⚠️  Stopping suite due to failure. Fix the issue and re-run.");
    break;
  }
}

// ─── Summary Report ───────────────────────────────────────────────────────────
console.log("\n");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║                     E2E RESULTS SUMMARY                     ║");
console.log("╠══════════════════════════════════════════════════════════════╣");

let allPassed = true;
for (const r of results) {
  const icon   = r.passed ? "✅" : "❌";
  const status = r.passed ? "PASS" : "FAIL";
  const label  = r.name.padEnd(28);
  console.log(`║  ${icon}  ${label}  ${status}   (${r.elapsed}s)`);
  if (!r.passed) allPassed = false;
}

const skipped = SCRIPTS.length - results.length;
if (skipped > 0) {
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  ⏭   ${skipped} script(s) skipped due to earlier failure.             ║`);
}

console.log("╠══════════════════════════════════════════════════════════════╣");
if (allPassed && skipped === 0) {
  console.log("║  🎉  ALL TESTS PASSED — Full workflow verified end-to-end!   ║");
} else {
  console.log("║  ⛔  SOME TESTS FAILED — Review output above for details.    ║");
}
console.log("╚══════════════════════════════════════════════════════════════╝\n");

process.exit(allPassed && skipped === 0 ? 0 : 1);
