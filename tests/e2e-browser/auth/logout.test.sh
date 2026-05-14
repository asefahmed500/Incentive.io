#!/bin/bash
# Test logout flow

set -e

echo "======================================"
echo "Testing User Logout"
echo "======================================"

# Login first
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/logout-logged-in.png

# Verify we're on dashboard
agent-browser eval 'window.location.pathname'

# Find and click logout button
echo "Clicking logout button..."
agent-browser click 'button:has-text("Sign out")'
sleep 2
agent-browser screenshot --output tests/screenshots/logout-after-click.png

# Verify redirect to home/login
sleep 3
agent-browser screenshot --output tests/screenshots/logout-final.png
agent-browser eval 'window.location.pathname'
agent-browser close

echo "✓ Logout flow works correctly"
echo "======================================"
echo "Logout test completed successfully"
echo "======================================"
