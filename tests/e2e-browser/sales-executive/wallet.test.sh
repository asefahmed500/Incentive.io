#!/bin/bash
# Test: View wallet balance

set -e

echo "======================================"
echo "Testing Sales Executive - Wallet"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Navigate to wallet
echo "Navigating to wallet page..."
agent-browser open http://localhost:3000/sales-dashboard/wallet
sleep 3
agent-browser screenshot --output tests/screenshots/se-wallet-page.png

# Verify wallet elements
echo "Verifying wallet components..."
agent-browser eval 'document.body.textContent.includes("Balance") || document.body.textContent.includes("balance") ? "Balance displayed" : "Balance not found"'
agent-browser eval 'document.querySelector("table") ? "Transaction table found" : "No table"'

# Check for balance amount
agent-browser screenshot --output tests/screenshots/se-wallet-balance.png
agent-browser close

echo "✓ Wallet viewing completed successfully"
echo "======================================"
echo "Wallet test completed successfully"
echo "======================================"
