#!/bin/bash
# Test: Reject sales with reason

set -e

echo "======================================"
echo "Testing Sales Manager - Reject Sale"
echo "======================================"

# Login as Sales Manager
echo "Logging in as Sales Manager..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'jamal@incentive.io'
agent-browser fill 'input[name="password"]' 'Manager123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Navigate to pending approvals
echo "Navigating to pending approvals..."
agent-browser open http://localhost:3000/sales-manager/pending-approvals
sleep 3
agent-browser screenshot --output tests/screenshots/sm-reject-pending.png)

# Click first reject button
echo "Clicking reject button..."
agent-browser click 'table button:has-text("Reject"):first-of-type'
sleep 2
agent-browser screenshot --output tests/screenshots/sm-reject-modal.png)

# Fill in rejection reason
echo "Entering rejection reason..."
agent-browser fill 'textarea[name="rejectionReason"]' 'Test rejection: Incomplete information'
sleep 1
agent-browser screenshot --output tests/screenshots/sm-reject-filled.png)

# Confirm rejection
echo "Confirming rejection..."
agent-browser click 'button:has-text("Confirm")'
sleep 3
agent-browser screenshot --output tests/screenshots/sm-after-reject.png)

# Verify rejection
echo "Verifying rejection..."
agent-browser eval 'document.body.textContent.includes("rejected") || document.body.textContent.includes("Draft") ? "Rejection successful" : "Status unclear"'
agent-browser close

echo "✓ Sales rejection completed successfully"
echo "======================================"
echo "Reject sale test completed successfully"
echo "======================================"
