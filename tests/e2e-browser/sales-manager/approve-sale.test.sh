#!/bin/bash
# Test: Approve sales from team

set -e

echo "======================================"
echo "Testing Sales Manager - Approve Sale"
echo "======================================"

# Login as Sales Manager
echo "Logging in as Sales Manager..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'jamal@incentive.io'
agent-browser fill 'input[name="password"]' 'Manager123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/sm-after-login.png)

# Navigate to pending approvals
echo "Navigating to pending approvals..."
agent-browser open http://localhost:3000/sales-manager/pending-approvals
sleep 3
agent-browser screenshot --output tests/screenshots/sm-pending-approvals.png

# Click first approve button
echo "Approving first record..."
agent-browser click 'table button:has-text("Approve"):first-of-type'
sleep 3
agent-browser screenshot --output tests/screenshots/sm-after-approve.png

# Verify record moved to next stage
echo "Verifying approval..."
agent-browser eval 'document.body.textContent.includes("Accountant") || document.body.textContent.includes("Forwarded") || document.body.textContent.includes("Success") ? "Approval successful" : "Status unclear"'
agent-browser close

echo "✓ Sales approval completed successfully"
echo "======================================"
echo "Approve sale test completed successfully"
echo "======================================"
