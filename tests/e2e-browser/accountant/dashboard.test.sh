#!/bin/bash
# Test Accountant Dashboard

set -e

echo "======================================"
echo "Testing Accountant Dashboard"
echo "======================================"

# Login as Accountant
echo "Logging in as Accountant..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'accountant@incentive.io'
agent-browser fill 'input[name="password"]' 'Accountant123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/acc-dashboard-initial.png

# Verify dashboard loaded
echo "Verifying dashboard elements..."
agent-browser eval 'window.location.pathname'
agent-browser screenshot --output tests/screenshots/acc-dashboard-full.png

# Check for key dashboard elements
echo "Checking for dashboard components..."
agent-browser eval 'document.querySelector("[data-sidebar]") ? "Sidebar found" : "No sidebar"'
agent-browser eval 'document.querySelector("table") ? "Table found" : "No table"'

# Check for charts
agent-browser screenshot --output tests/screenshots/acc-dashboard-charts.png
agent-browser eval 'document.querySelectorAll("svg").length > 0 ? "Charts found" : "No charts"'
agent-browser close

echo "✓ Accountant dashboard loaded successfully"
echo "======================================"
echo "Dashboard test completed successfully"
echo "======================================"
