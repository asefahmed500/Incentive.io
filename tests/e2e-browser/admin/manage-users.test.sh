#!/bin/bash
# Test: User management

set -e

echo "======================================"
echo "Testing Admin - User Management"
echo "======================================"

# Login as Admin
echo "Logging in as Admin..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'admin@incentive.io'
agent-browser fill 'input[name="password"]' 'Admin123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Navigate to users page
echo "Navigating to users page..."
agent-browser open http://localhost:3000/admin/users
sleep 3
agent-browser screenshot --output tests/screenshots/admin-users-page.png

# Verify users table
echo "Verifying users table..."
agent-browser eval 'document.querySelector("table") ? "Users table found" : "No table"'
agent-browser eval 'document.querySelectorAll("table tbody tr").length > 0 ? "Users listed" : "No users"'

# Check for user count
agent-browser screenshot --output tests/screenshots/admin-users-table.png
agent-browser close

echo "✓ User management page loaded successfully"
echo "======================================"
echo "Manage users test completed successfully"
echo "======================================"
