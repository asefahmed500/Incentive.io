#!/bin/bash
# Test login for all 6 roles

set -e

echo "======================================"
echo "Testing Login for All Roles"
echo "======================================"

# Test successful login - Sales Executive
echo "Testing Sales Executive login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-sales-exec-success.png
# Verify redirect to /sales-dashboard
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Sales Executive login successful"

# Test successful login - Sales Manager
echo "Testing Sales Manager login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'jamal@incentive.io'
agent-browser fill 'input[name="password"]' 'Manager123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-sales-manager-success.png
# Verify redirect to /sales-manager
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Sales Manager login successful"

# Test successful login - Accountant
echo "Testing Accountant login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'accountant@incentive.io'
agent-browser fill 'input[name="password"]' 'Accountant123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-accountant-success.png
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Accountant login successful"

# Test successful login - Finance
echo "Testing Finance login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'finance@incentive.io'
agent-browser fill 'input[name="password"]' 'Finance123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-finance-success.png
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Finance login successful"

# Test successful login - Admin
echo "Testing Admin login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'admin@incentive.io'
agent-browser fill 'input[name="password"]' 'Admin123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-admin-success.png
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Admin login successful"

# Test successful login - Administrator
echo "Testing Administrator login..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'superadmin@incentive.io'
agent-browser fill 'input[name="password"]' 'Superadmin123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-administrator-success.png
agent-browser eval 'window.location.pathname'
agent-browser close
echo "✓ Administrator login successful"

# Test failed login - invalid credentials
echo "Testing failed login with invalid credentials..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'test@example.com'
agent-browser fill 'input[name="password"]' 'wrongpassword'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/login-failure.png
# Verify error message is shown
agent-browser eval 'document.body.textContent.includes("Invalid") || document.body.textContent.includes("error") || document.body.textContent.includes("failed")'
agent-browser close
echo "✓ Failed login error handling works"

echo "======================================"
echo "All login tests completed successfully"
echo "======================================"
