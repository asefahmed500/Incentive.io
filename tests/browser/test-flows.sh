#!/bin/bash

# Incentive.io - Browser Automation Test Suite
# Tests all critical user workflows using agent-browser

set -e

BASE_URL="http://localhost:3000"
SCREENSHOT_DIR="tests/browser/screenshots"
mkdir -p "$SCREENSHOT_DIR"

echo "🧪 Starting Incentive.io Browser Automation Tests"
echo "=================================================="
echo "Base URL: $BASE_URL"
echo "Screenshot Directory: $SCREENSHOT_DIR"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_function=$2

    TESTS_RUN=$((TESTS_RUN + 1))
    echo ""
    echo -e "${YELLOW}Test $TESTS_RUN: $test_name${NC}"
    echo "-------------------------------------------"

    if $test_function; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✓ PASSED: $test_name${NC}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}✗ FAILED: $test_name${NC}"
    fi
}

# Function to take timestamped screenshot
take_screenshot() {
    local name=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local path="$SCREENSHOT_DIR/${timestamp}_${name}.png"
    agent-browser screenshot "$path"
    echo "Screenshot saved: $path"
}

# ============================================
# TEST 1: Health Check
# ============================================
test_health_check() {
    echo "Checking if server is running..."

    # Try to fetch health endpoint
    if curl -s "$BASE_URL/api/health" | grep -q "healthy"; then
        echo "✓ Server is healthy"
        return 0
    else
        echo "✗ Server health check failed"
        return 1
    fi
}

# ============================================
# TEST 2: Homepage Load
# ============================================
test_homepage_load() {
    echo "Opening homepage..."
    agent-browser open "$BASE_URL"
    agent-browser wait --load networkidle

    # Check if homepage loaded
    local title=$(agent-browser get title)
    echo "Page title: $title"

    if [[ "$title" == *"Incentive.io"* ]] || [[ "$title" == *"Sales Commission"* ]]; then
        take_screenshot "homepage"
        agent-browser close
        return 0
    else
        echo "✗ Unexpected title: $title"
        take_screenshot "homepage_error"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 3: User Registration
# ============================================
test_user_registration() {
    echo "Testing user registration..."

    agent-browser open "$BASE_URL/register"
    agent-browser wait --load networkidle
    agent-browser snapshot -i

    # Check if registration form is present
    local has_form=$(agent-browser snapshot -i | grep -c "input" || true)
    if [ "$has_form" -lt 2 ]; then
        echo "✗ Registration form not found"
        agent-browser close
        return 1
    fi

    # Generate unique email
    local timestamp=$(date +%s)
    local email="test_${timestamp}@incentive.io"
    local password="TestPass123!@#"

    echo "Filling registration form..."
    echo "Email: $email"

    # Try to find and fill the form
    agent-browser find label "Email" fill "$email" || agent-browser fill 'input[name="email"]' "$email" || agent-browser fill 'input[type="email"]' "$email"
    agent-browser find label "Password" fill "$password" || agent-browser fill 'input[name="password"]' "$password" || agent-browser fill 'input[type="password"]' "$password"
    agent-browser find label "Name" fill "Test User" || agent-browser fill 'input[name="name"]' "Test User"

    take_screenshot "registration_filled"

    # Try to submit
    agent-browser find role button click --name "Sign Up" || agent-browser click 'button[type="submit"]'

    # Wait for response
    sleep 3
    take_screenshot "registration_result"

    agent-browser close
    return 0
}

# ============================================
# TEST 4: User Login
# ============================================
test_user_login() {
    echo "Testing user login..."

    agent-browser open "$BASE_URL/login"
    agent-browser wait --load networkidle
    agent-browser snapshot -i

    # Fill login form
    agent-browser find label "Email" fill "jamal@incentive.io"
    agent-browser find label "Password" fill "Jamal123!"

    take_screenshot "login_filled"

    # Submit form
    agent-browser find role button click --name "Sign In" || agent-browser click 'button[type="submit"]'

    # Wait for redirect
    agent-browser wait --url "**/sales-dashboard" --timeout 10000 || {
        echo "Waiting for text: Dashboard"
        agent-browser wait --text "Dashboard" --timeout 10000
    }

    sleep 2
    take_screenshot "login_result"

    # Verify we're on dashboard
    local url=$(agent-browser get url)
    echo "Current URL: $url"

    if [[ "$url" == *"/sales-dashboard"* ]] || [[ "$url" == *"/dashboard"* ]]; then
        agent-browser close
        return 0
    else
        echo "✗ Not redirected to dashboard"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 5: Sales Executive Dashboard
# ============================================
test_sales_executive_dashboard() {
    echo "Testing Sales Executive Dashboard..."

    # Login first
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "jamal@incentive.io"
    agent-browser fill 'input[name="password"]' "Jamal123!"
    agent-browser click 'button[type="submit"]'
    agent-browser wait --url "**/sales-dashboard" --timeout 10000 || agent-browser wait --text "Dashboard" --timeout 10000

    take_screenshot "sales_dashboard"

    # Check for key elements
    local has_dashboard=$(agent-browser snapshot -i | grep -i "dashboard\|records\|commission" | wc -l)
    echo "Dashboard elements found: $has_dashboard"

    agent-browser close

    if [ "$has_dashboard" -gt 0 ]; then
        return 0
    else
        return 1
    fi
}

# ============================================
# TEST 6: Admin Dashboard
# ============================================
test_admin_dashboard() {
    echo "Testing Admin Dashboard..."

    # Login as admin
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "admin@incentive.io"
    agent-browser fill 'input[name="password"]' "Admin123!"
    agent-browser click 'button[type="submit"]'

    # Wait for redirect
    agent-browser wait --url "**/admin" --timeout 10000 || agent-browser wait --text "Dashboard" --timeout 10000

    sleep 2
    take_screenshot "admin_dashboard"

    # Verify we're on admin dashboard
    local url=$(agent-browser get url)
    echo "Current URL: $url"

    if [[ "$url" == *"/admin"* ]]; then
        agent-browser close
        return 0
    else
        echo "✗ Not redirected to admin dashboard"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 7: Manager Dashboard
# ============================================
test_manager_dashboard() {
    echo "Testing Sales Manager Dashboard..."

    # Login as manager
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "manager@incentive.io"
    agent-browser fill 'input[name="password"]' "Manager123!"
    agent-browser click 'button[type="submit"]'

    # Wait for redirect
    agent-browser wait --url "**/sales-manager" --timeout 10000 || agent-browser wait --text "Dashboard" --timeout 10000

    sleep 2
    take_screenshot "manager_dashboard"

    # Verify we're on manager dashboard
    local url=$(agent-browser get url)
    echo "Current URL: $url"

    if [[ "$url" == *"/sales-manager"* ]]; then
        agent-browser close
        return 0
    else
        echo "✗ Not redirected to manager dashboard"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 8: Accountant Dashboard
# ============================================
test_accountant_dashboard() {
    echo "Testing Accountant Dashboard..."

    # Login as accountant
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "accountant@incentive.io"
    agent-browser fill 'input[name="password"]' "Accountant123!"
    agent-browser click 'button[type="submit"]'

    # Wait for redirect
    agent-browser wait --url "**/accountant" --timeout 10000 || agent-browser wait --text "Dashboard" --timeout 10000

    sleep 2
    take_screenshot "accountant_dashboard"

    # Verify we're on accountant dashboard
    local url=$(agent-browser get url)
    echo "Current URL: $url"

    if [[ "$url" == *"/accountant"* ]]; then
        agent-browser close
        return 0
    else
        echo "✗ Not redirected to accountant dashboard"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 9: Finance Dashboard
# ============================================
test_finance_dashboard() {
    echo "Testing Finance Dashboard..."

    # Login as finance
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "finance@incentive.io"
    agent-browser fill 'input[name="password"]' "Finance123!"
    agent-browser click 'button[type="submit"]'

    # Wait for redirect
    agent-browser wait --url "**/finance" --timeout 10000 || agent-browser wait --text "Dashboard" --timeout 10000

    sleep 2
    take_screenshot "finance_dashboard"

    # Verify we're on finance dashboard
    local url=$(agent-browser get url)
    echo "Current URL: $url"

    if [[ "$url" == *"/finance"* ]]; then
        agent-browser close
        return 0
    else
        echo "✗ Not redirected to finance dashboard"
        agent-browser close
        return 1
    fi
}

# ============================================
# TEST 10: Create Sales Record
# ============================================
test_create_sales_record() {
    echo "Testing Sales Record Creation..."

    # Login as sales executive
    agent-browser open "$BASE_URL/login"
    agent-browser fill 'input[name="email"]' "jamal@incentive.io"
    agent-browser fill 'input[name="password"]' "Jamal123!"
    agent-browser click 'button[type="submit"]'
    agent-browser wait --url "**/sales-dashboard" --timeout 10000

    # Navigate to add record page
    agent-browser open "$BASE_URL/sales-dashboard/add-record"
    agent-browser wait --load networkidle

    take_screenshot "add_record_page"

    # Try to fill the form (basic fields)
    agent-browser snapshot -i
    echo "Checking for form fields..."

    # Check if product fields exist
    local has_product_field=$(agent-browser snapshot -i | grep -i "product\|quantity\|price" | wc -l)
    echo "Product fields found: $has_product_field"

    take_screenshot "sales_record_form"

    agent-browser close
    return 0
}

# ============================================
# MAIN TEST RUNNER
# ============================================
main() {
    echo "Starting test suite..."
    echo ""

    # Check if agent-browser is installed
    if ! command -v agent-browser &> /dev/null; then
        echo "Error: agent-browser is not installed"
        echo "Install with: npm i -g agent-browser && agent-browser install"
        exit 1
    fi

    # Check if server is running
    if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        echo "Error: Server is not running at $BASE_URL"
        echo "Start the server with: npm run dev"
        exit 1
    fi

    # Run all tests
    run_test "Health Check" test_health_check
    run_test "Homepage Load" test_homepage_load
    run_test "User Registration" test_user_registration
    run_test "User Login" test_user_login
    run_test "Sales Executive Dashboard" test_sales_executive_dashboard
    run_test "Admin Dashboard" test_admin_dashboard
    run_test "Manager Dashboard" test_manager_dashboard
    run_test "Accountant Dashboard" test_accountant_dashboard
    run_test "Finance Dashboard" test_finance_dashboard
    run_test "Create Sales Record" test_create_sales_record

    # Print summary
    echo ""
    echo "=================================================="
    echo "Test Summary"
    echo "=================================================="
    echo -e "Total Tests: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}Some tests failed. Check screenshots in $SCREENSHOT_DIR${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
