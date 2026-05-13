#!/usr/bin/env node

/**
 * Quick test script to verify tunnel system components
 * Run with: node scripts/tunnel-test.js
 */

import { spawn, exec } from "child_process";

const tests = [
  {
    name: "Node.js availability",
    test: async () => {
      return new Promise((resolve) => {
        exec("node --version", { windowsHide: true }, (error, stdout) => {
          resolve({
            pass: !error,
            message: error ? "Node.js not found" : `Node.js ${stdout.trim()}`
          });
        });
      });
    }
  },
  {
    name: "cloudflared installation",
    test: async () => {
      return new Promise((resolve) => {
        exec("cloudflared --version", { windowsHide: true }, (error, stdout) => {
          resolve({
            pass: !error,
            message: error ? "cloudflared not installed" : stdout.trim()
          });
        });
      });
    }
  },
  {
    name: "Port availability check",
    test: async () => {
      return new Promise((resolve) => {
        exec("netstat -ano | findstr :3000", { windowsHide: true }, (error, stdout) => {
          const inUse = stdout.trim().length > 0;
          resolve({
            pass: !inUse,
            message: inUse ? "Port 3000 is in use" : "Port 3000 is available"
          });
        });
      });
    }
  },
  {
    name: "Dev tunnel script exists",
    test: async () => {
      const fs = await import("fs");
      const exists = fs.existsSync("./scripts/dev-tunnel.js");
      return {
        pass: exists,
        message: exists ? "dev-tunnel.js found" : "dev-tunnel.js not found"
      };
    }
  },
  {
    name: "Package.json share script",
    test: async () => {
      const fs = await import("fs");
      const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
      const hasShare = pkg.scripts && pkg.scripts.share;
      return {
        pass: !!hasShare,
        message: hasShare ? `Share script: ${hasShare}` : "No share script found"
      };
    }
  }
];

async function runTests() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║       Development Tunnel System - Test Suite             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");

  let passCount = 0;
  let failCount = 0;

  for (const test of tests) {
    const result = await test.test();
    const status = result.pass ? "✓" : "✗";
    const color = result.pass ? "\x1b[32m" : "\x1b[31m";
    const reset = "\x1b[0m";

    console.log(`${color}${status}${reset} ${test.name}`);
    console.log(`  ${result.message}`);
    console.log("");

    if (result.pass) passCount++;
    else failCount++;
  }

  console.log("─────────────────────────────────────────────────────────────");
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log("─────────────────────────────────────────────────────────────");

  if (failCount > 0) {
    console.log("");
    console.log("\x1b[33m⚠️  Some tests failed. Please fix the issues before using npm run share\x1b[0m");
    console.log("");
  } else {
    console.log("");
    console.log("\x1b[32m✓ All checks passed! You can now run: npm run share\x1b[0m");
    console.log("");
  }
}

runTests().catch(console.error);
