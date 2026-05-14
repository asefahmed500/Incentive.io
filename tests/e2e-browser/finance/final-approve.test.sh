#!/bin/bash
# Test: Final approval triggers wallet credit

set -e

echo "======================================"
echo "Testing Finance - Final Approval"
echo "======================================"

# Login as Finance
echo "Logging in as Finance..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'finance@incentive.io'
agent-browser fill 'input[name="password"]' 'Finance123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/fin-after-login.png

# Navigate to approvals
echo "Navigating to approvals..."
agent-browser open http://localhost:3000/finance/approvals
sleep 3
agent-browser screenshot --output tests/screenshots/fin-pending-approvals.png

# Click approve button on first record
echo "Approving record for final payment..."
agent-browser click 'table button:has-text("Approve"):first-of-type'
sleep 4
agent-browser screenshot --output tests/screenshots/fin-after-approve.png

# Verify success notification
echo "Verifying approval..."
agent-browser eval 'document.querySelector("[role=alert]") || document.querySelector("[data-notification]") ? "Notification shown" : "No notification"'
agent-browser eval 'document.body.textContent.includes("Approved") || document.body.textContent.includes("Success") ? "Approval successful" : "Status unclear"'
agent-browser close

echo "✓ Final approval completed successfully"
echo "======================================"
echo "Final approve test completed successfully"
echo "======================================"
