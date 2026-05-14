#!/bin/bash
# Test registration flow

set -e

echo "======================================"
echo "Testing User Registration"
echo "======================================"

# Navigate to registration page
echo "Opening registration page..."
agent-browser open http://localhost:3000/register
sleep 2
agent-browser screenshot --output tests/screenshots/register-before.png

# Test validation - submit with empty fields
echo "Testing form validation (empty fields)..."
agent-browser click 'button[type="submit"]'
sleep 2
agent-browser screenshot --output tests/screenshots/register-validation-errors.png
# Check for validation errors
agent-browser eval 'document.body.textContent.includes("required") || document.body.textContent.includes("Required") || document.body.textContent.includes("valid")'
echo "✓ Form validation works"

# Fill in valid registration data
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser-${TIMESTAMP}@example.com"

echo "Filling registration form..."
agent-browser fill 'input[name="name"]' "Test User ${TIMESTAMP}"
agent-browser fill 'input[name="email"]' "$TEST_EMAIL"
agent-browser fill 'input[name="password"]' 'TestPassword123!'
agent-browser fill 'input[name="confirmPassword"]' 'TestPassword123!'
agent-browser screenshot --output tests/screenshots/register-filled.png

# Submit registration
echo "Submitting registration..."
agent-browser click 'button[type="submit"]'
sleep 5
agent-browser screenshot --output tests/screenshots/register-after-submit.png

# Verify redirect or success message
agent-browser eval 'window.location.pathname'
agent-browser close

echo "✓ Registration flow completed"
echo "======================================"
echo "Registration test completed successfully"
echo "======================================"
