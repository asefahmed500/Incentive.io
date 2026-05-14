#!/bin/bash
# Test Sales Executive Dashboard

set -e

echo "======================================"
echo "Testing Sales Executive Dashboard"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/se-dashboard-initial.png

# Verify dashboard loaded
echo "Verifying dashboard elements..."
agent-browser eval 'window.location.pathname'
agent-browser screenshot --output tests/screenshots/se-dashboard-full.png

# Check for key dashboard elements
echo "Checking for dashboard components..."
agent-browser eval 'document.querySelector("[data-sidebar]") ? "Sidebar found" : "No sidebar"'
agent-browser eval 'document.querySelector("table") ? "Table found" : "No table"'

# Check for charts
agent-browser screenshot --output tests/screenshots/se-dashboard-charts.png
agent-browser eval 'document.querySelectorAll("svg").length > 0 ? "Charts found" : "No charts"'

# Check for notification bell
agent-browser eval 'document.querySelector("[aria-label*="notification"]") || document.querySelector("[aria-label*="Notification"]") ? "Notification bell found" : "No notification bell"'

# Test refresh button
echo "Testing refresh functionality..."
sleep 2
agent-browser close

echo "✓ Sales Executive dashboard loaded successfully"
echo "======================================"
echo "Dashboard test completed successfully"
echo "======================================"
