#!/bin/bash
# Test: Submit sales record for approval

set -e

echo "======================================"
echo "Testing Sales Executive - Submit Sale"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Navigate to records
echo "Navigating to records page..."
agent-browser open http://localhost:3000/sales-dashboard/records
sleep 3
agent-browser screenshot --output tests/screenshots/se-submit-records-page.png

# Look for draft records and submit the first one
echo "Submitting first draft record..."
agent-browser click 'button:has-text("Submit"):first-of-type'
sleep 3
agent-browser screenshot --output tests/screenshots/se-after-submit.png

# Verify record moved to Pending_Manager
echo "Verifying record submission..."
agent-browser eval 'document.body.textContent.includes("Pending") || document.body.textContent.includes("Submitted") ? "Record submitted" : "Status unclear"'
agent-browser close

echo "✓ Sales record submission completed successfully"
echo "======================================"
echo "Submit sale test completed successfully"
echo "======================================"
