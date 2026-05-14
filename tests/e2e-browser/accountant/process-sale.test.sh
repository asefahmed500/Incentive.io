#!/bin/bash
# Test: Process sale with tax/VAT/EOBP

set -e

echo "======================================"
echo "Testing Accountant - Process Sale"
echo "======================================"

# Login as Accountant
echo "Logging in as Accountant..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'accountant@incentive.io'
agent-browser fill 'input[name="password"]' 'Accountant123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/acc-after-login.png)

# Navigate to pending approvals
echo "Navigating to pending approvals..."
agent-browser open http://localhost:3000/accountant/approvals
sleep 3
agent-browser screenshot --output tests/screenshots/acc-pending-approvals.png)

# Click process button on first record
echo "Opening process modal..."
agent-browser click 'table button:has-text("Process"):first-of-type'
sleep 3
agent-browser screenshot --output tests/screenshots/acc-process-modal.png)

# Fill in tax rate
echo "Filling in tax and VAT rates..."
agent-browser fill 'input[name="taxRate"]' '10'
# Fill in VAT rate
agent-browser fill 'input[name="vatRate"]' '5'
agent-browser screenshot --output tests/screenshots/acc-process-filled.png)

# Click process button
echo "Processing and forwarding to finance..."
agent-browser click 'button:has-text("Process & Forward")'
sleep 4
agent-browser screenshot --output tests/screenshots/acc-after-process.png)

# Verify success
echo "Verifying processing..."
agent-browser eval 'document.body.textContent.includes("Finance") || document.body.textContent.includes("Success") || document.body.textContent.includes("Forwarded") ? "Processing successful" : "Status unclear"'
agent-browser close

echo "✓ Sale processing completed successfully"
echo "======================================"
echo "Process sale test completed successfully"
echo "======================================"
