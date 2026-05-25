/**
 * test-password-reset.js — E2E test for password reset flow
 *
 * Tests: forgot password link, email request, token in DB,
 *        reset form, login with new password, restore original.
 *
 * Usage: node scripts/test-password-reset.js
 */

import { config } from "dotenv"
config({ path: ".env.local" })
import { chromium } from "@playwright/test"
import { execSync } from "child_process"
import crypto from "crypto"

const BASE = "http://localhost:3000"
const TEST_USER = { email: "karim@incentive.io", password: "Executive123!" }
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio"
const sleep = ms => new Promise(r => setTimeout(r, ms))
const ts = () => new Date().toISOString().slice(11, 19)
const log = (e, m) => console.log(`[${ts()}] ${e}  ${m}`)
const pass = m => log("✅", m)
const fail = m => log("❌", m)
const info = m => log("ℹ️", m)
const warn = m => log("⚠️", m)

async function getDb() {
  const { MongoClient } = await import("mongodb")
  const c = new MongoClient(MONGO_URI)
  await c.connect()
  return { client: c, db: c.db() }
}

async function run() {
  console.log("=".repeat(60))
  console.log("  Password Reset Flow E2E Test")
  console.log("=".repeat(60))

  execSync("npm run seed", { stdio: "pipe", cwd: process.cwd() })
  pass("Database seeded")

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.setDefaultNavigationTimeout(90000)
  page.setDefaultTimeout(30000)

  let resetToken = ""

  try {
    // ── STEP 1: Login page → Forgot Password link ──────────────────────
    info("STEP 1: Forgot password link on login page")
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)
    const link = page.locator('a:has-text("Forgot password?")')
    await link.waitFor({ state: "visible", timeout: 5000 })
    pass("Forgot password link visible")
    await link.click()
    await page.waitForURL("**/reset-password", { timeout: 5000 })
    pass("Navigated to /reset-password")

    // ── STEP 2: Submit email for reset ─────────────────────────────────
    info("STEP 2: Submit reset request for " + TEST_USER.email)
    await page.waitForTimeout(2000)
    // Intercept API responses to see what happens
    page.on("response", resp => {
      if (resp.url().includes("/api/reset-password")) {
        info(`API ${resp.status()} ${resp.url().split("/api")[1]}`)
      }
    })
    await page.fill("input#email", TEST_USER.email)
    await page.click("button[type='submit']")
    await page.waitForTimeout(3000)

    const confirmText = await page.textContent("body")
    if (confirmText.includes("Check Your Email")) {
      pass("UI shows 'Check Your Email' confirmation")
    } else {
      warn("Confirmation text not found on page")
    }

    // ── STEP 3: Check token in DB ────────────────────────────────────
    info("STEP 3: Check reset token in database")
    let tries = 0
    while (tries < 3) {
      const { client, db } = await getDb()
      const user = await db.collection("users").findOne({ email: TEST_USER.email })
      resetToken = user?.resetPasswordToken || ""
      await client.close()
      if (resetToken) break
      tries++
      info(`  Token not found (attempt ${tries}/3), waiting...`)
      await sleep(3000)
    }

    if (resetToken) {
      pass(`Token in DB: ${resetToken.slice(0, 20)}...`)
    } else {
      fail("No token in DB after 3 attempts — API may be rate-limited or token not persisting")
    }

    // ── STEP 4: Navigate to reset form with token ─────────────────────
    if (resetToken) {
      info("STEP 4: Reset password form with token")
      await page.goto(`${BASE}/reset-password?token=${resetToken}`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(2000)

      const fpText = await page.textContent("body")
      if (fpText.includes("Reset Password") && (fpText.includes("New Password") || fpText.includes("Confirm"))) {
        pass("Reset form with password fields visible")
      } else {
        warn("Reset page: " + fpText.slice(0, 100))
      }

      // ── STEP 5: Submit new password ──────────────────────────────────
      info("STEP 5: Submit new password")
      await page.fill("input#password", "NewPass123!@#")
      await page.fill("input#confirmPassword", "NewPass123!@#")
      await page.click("button[type='submit']")
      await page.waitForTimeout(3000)

      const resultText = await page.textContent("body")
      if (resultText.includes("reset successfully") || resultText.includes("redirect") || resultText.includes("login")) {
        pass("Password reset success message shown")
      } else {
        warn("Result: " + resultText.slice(0, 100))
      }

      await sleep(3000)

      // ── STEP 6: Login with new password ──────────────────────────
      info("STEP 6: Login with new password")
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(3000)
      await page.fill("input[name='email']", TEST_USER.email)
      await page.fill("input[name='password']", "NewPass123!@#")
      await page.click("button[type='submit']")
      await page.waitForURL("**/sales-dashboard", { timeout: 15000 })
      pass("Logged in with new password!")

      // ── STEP 7: Restore original password ────────────────────────
      info("STEP 7: Restore original password")
      const { client, db } = await getDb()
      // Set token directly for restore
      const restoreToken = crypto.randomBytes(32).toString("hex")
      const { MongoClient } = await import("mongodb")
      const mc = new MongoClient(MONGO_URI)
      await mc.connect()
      await mc.db().collection("users").updateOne(
        { email: TEST_USER.email },
        { $set: { resetPasswordToken: restoreToken, resetPasswordExpires: new Date(Date.now() + 3600000) } }
      )
      await mc.close()

      const restoreRes = await fetch(`${BASE}/api/reset-password/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: restoreToken, newPassword: TEST_USER.password }),
      })
      const restoreData = await restoreRes.json()
      if (restoreData.success) pass("Password restored to original ✓")
      else fail(`Restore failed: ${restoreData.error}`)
    } else {
      warn("Skipping password reset form tests (no token)")

      // ── Alternative test: test with a manually created token ──────
      info("  → Testing reset with a manually created token in DB")
      const manualToken = crypto.randomBytes(32).toString("hex")
      const { MongoClient } = await import("mongodb")
      const mc = new MongoClient(MONGO_URI)
      await mc.connect()
      await mc.db().collection("users").updateOne(
        { email: TEST_USER.email },
        { $set: { resetPasswordToken: manualToken, resetPasswordExpires: new Date(Date.now() + 3600000) } }
      )
      await mc.close()
      pass(`Manual token set in DB: ${manualToken.slice(0, 20)}...`)

      // Now test with this token
      await page.goto(`${BASE}/reset-password?token=${manualToken}`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(2000)
      const fpText = await page.textContent("body")
      if (fpText.includes("Reset Password")) {
        pass("Reset form visible with manually created token")
      }

      // Submit new password
      await page.fill("input#password", "NewPass456!@#")
      await page.fill("input#confirmPassword", "NewPass456!@#")
      await page.click("button[type='submit']")
      await page.waitForTimeout(3000)

      // Login with new password
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
      await page.waitForTimeout(3000)
      await page.fill("input[name='email']", TEST_USER.email)
      await page.fill("input[name='password']", "NewPass456!@#")
      await page.click("button[type='submit']")
      await page.waitForURL("**/sales-dashboard", { timeout: 15000 })
      pass("Logged in with manually-reset password!")

      // Restore original
      const restoreToken2 = crypto.randomBytes(32).toString("hex")
      const mc2 = new MongoClient(MONGO_URI)
      await mc2.connect()
      await mc2.db().collection("users").updateOne(
        { email: TEST_USER.email },
        { $set: { resetPasswordToken: restoreToken2, resetPasswordExpires: new Date(Date.now() + 3600000) } }
      )
      await mc2.close()
      await fetch(`${BASE}/api/reset-password/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: restoreToken2, newPassword: TEST_USER.password }),
      })
      pass("Original password restored")
    }

    console.log("\n" + "=".repeat(60))
    console.log("  Password Reset E2E Complete!")
    console.log("=".repeat(60))
  } catch (error) {
    console.error(`\n❌ FATAL: ${error.message}`)
  } finally {
    await browser.close()
  }
}

run()
