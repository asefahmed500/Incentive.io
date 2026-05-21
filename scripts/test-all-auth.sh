#!/bin/bash

# Comprehensive Authentication Test Script for Incentive.io
# Tests all 6 user roles with agent-browser

echo "🔐 Incentive.io - Authentication Testing"
echo "=========================================="
echo ""

# Test credentials
declare -A TEST_USERS=(
  ["admin"]="admin@incentive.io|Admin123!|/admin/dashboard"
  ["administrator"]="superadmin@incentive.io|Superadmin123!|/administrator"
  ["salesManager"]="jamal@incentive.io|Manager123!|/sales-manager"
  ["accountant"]="accountant@incentive.io|Accountant123!|/accountant"
  ["finance"]="finance@incentive.io|Finance123!|/finance"
  ["salesExecutive"]="karim@incentive.io|Executive123!|/sales-dashboard"
)

passed=0
failed=0
results=()

# Function to test a single role
test_role() {
  local role=$1
  local email=$2
  local password=$3
  local expected_path=$4

  echo "🧪 Testing $role..."
  echo "   Email: $email"
  echo "   Expected: $expected_path"

  # Open login page in new session
  agent-browser --session "test-$role" open http://localhost:3000/login > /dev/null 2>&1

  # Take snapshot and fill form
  agent-browser --session "test-$role" snapshot -i > /tmp/snapshot-${role}.txt 2>&1

  # Extract refs from snapshot
  email_ref=$(grep "textbox \"Email\"" /tmp/snapshot-${role}.txt | grep -o "ref=e[0-9]*" | head -1 | cut -d= -f2)
  pass_ref=$(grep "textbox \"Password\"" /tmp/snapshot-${role}.txt | grep -o "ref=e[0-9]*" | head -1 | cut -d= -f2)
  button_ref=$(grep "button \"Sign in\"" /tmp/snapshot-${role}.txt | grep -o "ref=e[0-9]*" | head -1 | cut -d= -f2)

  if [[ -z "$email_ref" ]] || [[ -z "$pass_ref" ]] || [[ -z "$button_ref" ]]; then
    echo "   ❌ FAILED: Could not find form elements"
    ((failed++))
    results+=("❌ $role - Form elements not found")
    return 1
  fi

  # Fill form
  agent-browser --session "test-$role" fill "@$email_ref" "$email" > /dev/null 2>&1
  agent-browser --session "test-$role" fill "@$pass_ref" "$password" > /dev/null 2>&1

  # Submit form
  agent-browser --session "test-$role" click "@$button_ref" > /dev/null 2>&1

  # Wait for redirect
  sleep 3

  # Check current URL
  current_url=$(agent-browser --session "test-$role" get url 2>/dev/null)

  if [[ "$current_url" == *"$expected_path"* ]]; then
    echo "   ✅ PASSED: Redirected to $current_url"
    ((passed++))
    results+=("✅ $role - $current_url")
  else
    echo "   ❌ FAILED: Expected $expected_path, got $current_url"
    ((failed++))
    results+=("❌ $role - Expected $expected_path, got $current_url")
  fi

  # Close session
  agent-browser --session "test-$role" close > /dev/null 2>&1
  echo ""
}

# Test each role
for role in "salesExecutive" "salesManager" "accountant" "finance" "admin" "administrator"; do
  IFS='|' read -r email password expected_path <<< "${TEST_USERS[$role]}"
  test_role "$role" "$email" "$password" "$expected_path"
done

# Print summary
echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo "✅ Passed: $passed/6"
echo "❌ Failed: $failed/6"
echo ""

for result in "${results[@]}"; do
  echo "$result"
done

echo ""
if [[ $failed -eq 0 ]]; then
  echo "🎉 All authentication tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Please review the logs above."
  exit 1
fi
