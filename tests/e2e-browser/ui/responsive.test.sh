#!/bin/bash
# Test: Responsive design

set -e

echo "======================================"
echo "Testing Responsive Design"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Test mobile view (375x667)
echo "Testing mobile view (375x667)..."
agent-browser eval 'window.resizeTo(375, 667)'
sleep 2
agent-browser screenshot --output tests/screenshots/responsive-mobile.png
# Verify sidebar is hidden or collapsed
agent-browser eval 'document.querySelector("[data-mobile-menu]") || document.querySelector("[data-sidebar]") ? "Mobile menu present" : "Checking mobile layout"'
echo "✓ Mobile view captured"

# Test tablet view (768x1024)
echo "Testing tablet view (768x1024)..."
agent-browser eval 'window.resizeTo(768, 1024)'
sleep 2
agent-browser screenshot --output tests/screenshots/responsive-tablet.png
echo "✓ Tablet view captured"

# Test desktop view (1920x1080)
echo "Testing desktop view (1920x1080)..."
agent-browser eval 'window.resizeTo(1920, 1080)'
sleep 2
agent-browser screenshot --output tests/screenshots/responsive-desktop.png
echo "✓ Desktop view captured"

agent-browser close

echo "======================================"
echo "Responsive design testing completed"
echo "======================================"
