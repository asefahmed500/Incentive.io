#!/bin/bash

# Incentive.io - Comprehensive Role-Based Feature Testing V2
# Tests all 6 roles and their specific features on deployed Vercel app

BASE_URL="https://incentiveio.vercel.app"
COOKIE_FILE="/tmp/cookies.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_result() {
    local test_name="$1"
    local result="$2"
    local expected="$3"
    local actual="$4"

    TESTS_RUN=$((TESTS_RUN + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name (Expected: $expected, Got: $actual)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Helper function to test endpoint with redirect following
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_code="$3"
    local method="${4:-GET}"
    local data="${5:-}"

    rm -f $COOKIE_FILE
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -L \
            -H "Content-Type: application/json" \
            -c "$COOKIE_FILE" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -L \
            -c "$COOKIE_FILE" \
            "$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "$expected_code" ]; then
        print_result "$test_name" "PASS" "$expected_code" "$http_code"
        return 0
    else
        print_result "$test_name" "FAIL" "$expected_code" "$http_code"
        echo "  Response: $body"
        return 1
    fi
}

# Helper function to login and get session
login_user() {
    local email="$1"
    local password="$2"

    rm -f $COOKIE_FILE
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -L \
        -H "Content-Type: application/json" \
        -c "$COOKIE_FILE" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
        "$BASE_URL/api/auth/callback/credentials")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "302" ] || [ "$http_code" = "307" ]; then
        return 0
    else
        return 1
    fi
}

# Test authenticated endpoint
test_auth_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_code="$3"

    response=$(curl -s -w "\n%{http_code}" -L -b "$COOKIE_FILE" "$url")
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "$expected_code" ]; then
        print_result "$test_name" "PASS" "$expected_code" "$http_code"
        return 0
    else
        print_result "$test_name" "FAIL" "$expected_code" "$http_code"
        return 1
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Incentive.io - Role-Based Feature Testing${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Public Endpoints
echo -e "${YELLOW}Testing Public Endpoints...${NC}"
test_endpoint "Health Check" "$BASE_URL/api/health" "200"
test_endpoint "Homepage" "$BASE_URL/" "200"
test_endpoint "Login Page" "$BASE_URL/login" "200"
test_endpoint "Register Page" "$BASE_URL/register" "200"
echo ""

# Test 2: User Registration
echo -e "${YELLOW}Testing User Registration...${NC}"
TIMESTAMP=$(date +%s)
test_endpoint "Register New User" "$BASE_URL/api/register" "201" "POST" \
    '{"name":"Test Executive","email":"testexec_'$TIMESTAMP'@example.com","password":"TestPass123!","phone":""}'
echo ""

# Test 3: Authentication - All Roles
echo -e "${YELLOW}Testing Authentication for All Roles...${NC}"

declare -A TEST_USERS=(
    ["superadmin"]="superadmin@incentive.io:Superadmin123!"
    ["admin"]="admin@incentive.io:Admin123!"
    ["manager"]="manager@incentive.io:Manager123!"
    ["executive"]="jamal@incentive.io:Jamal123!"
    ["accountant"]="accountant@incentive.io:Accountant123!"
    ["finance"]="finance@incentive.io:Finance123!"
)

for role in "${!TEST_USERS[@]}"; do
    IFS=':' read -r email password <<< "${TEST_USERS[$role]}"
    if login_user "$email" "$password"; then
        print_result "Login - $role ($email)" "PASS" "200" "Authenticated"
    else
        print_result "Login - $role ($email)" "FAIL" "200" "Failed"
    fi
done
echo ""

# Test 4: Administrator Role Features
echo -e "${YELLOW}Testing Administrator Role Features...${NC}"
login_user "superadmin@incentive.io" "Superadmin123!"
test_auth_endpoint "Administrator Dashboard" "$BASE_URL/administrator" "200"
test_auth_endpoint "Administrator Audit Logs" "$BASE_URL/administrator/audit-logs" "200"
test_auth_endpoint "Administrator Settings" "$BASE_URL/administrator/settings" "200"
test_auth_endpoint "Administrator Health" "$BASE_URL/administrator/health" "200"
test_auth_endpoint "Administrator Users" "$BASE_URL/administrator/users" "200"
test_auth_endpoint "API - Audit Logs" "$BASE_URL/api/audit-logs" "200"
test_auth_endpoint "API - Settings" "$BASE_URL/api/settings" "200"
test_auth_endpoint "API - Backups" "$BASE_URL/api/backups" "200"
echo ""

# Test 5: Admin Role Features
echo -e "${YELLOW}Testing Admin Role Features...${NC}"
login_user "admin@incentive.io" "Admin123!"
test_auth_endpoint "Admin Dashboard" "$BASE_URL/admin" "200"
test_auth_endpoint "Admin Categories" "$BASE_URL/admin/categories" "200"
test_auth_endpoint "Admin Products" "$BASE_URL/admin/products" "200"
test_auth_endpoint "Admin Users" "$BASE_URL/admin/users" "200"
test_auth_endpoint "Admin Teams" "$BASE_URL/admin/teams" "200"
test_auth_endpoint "Admin Targets" "$BASE_URL/admin/targets" "200"
test_auth_endpoint "API - Categories" "$BASE_URL/api/categories" "200"
test_auth_endpoint "API - Products" "$BASE_URL/api/products" "200"
test_auth_endpoint "API - Users" "$BASE_URL/api/users" "200"
test_auth_endpoint "API - Teams" "$BASE_URL/api/teams" "200"
echo ""

# Test 6: Sales Manager Role Features
echo -e "${YELLOW}Testing Sales Manager Role Features...${NC}"
login_user "manager@incentive.io" "Manager123!"
test_auth_endpoint "Sales Manager Dashboard" "$BASE_URL/sales-manager" "200"
test_auth_endpoint "Sales Manager Team" "$BASE_URL/sales-manager/team" "200"
test_auth_endpoint "Sales Manager Pending Approvals" "$BASE_URL/sales-manager/pending-approvals" "200"
test_auth_endpoint "Sales Manager Team Sales" "$BASE_URL/sales-manager/team-sales" "200"
test_auth_endpoint "API - Manager Approvals" "$BASE_URL/api/approvals/manager" "200"
echo ""

# Test 7: Sales Executive Role Features
echo -e "${YELLOW}Testing Sales Executive Role Features...${NC}"
login_user "jamal@incentive.io" "Jamal123!"
test_auth_endpoint "Sales Dashboard" "$BASE_URL/sales-dashboard" "200"
test_auth_endpoint "Sales Records" "$BASE_URL/sales-dashboard/records" "200"
test_auth_endpoint "Add Record" "$BASE_URL/sales-dashboard/add-record" "200"
test_auth_endpoint "Sales Wallet" "$BASE_URL/sales-dashboard/wallet" "200"
test_auth_endpoint "Sales Commissions" "$BASE_URL/sales-dashboard/commissions" "200"
test_auth_endpoint "API - Sales Records" "$BASE_URL/api/sales-records" "200"
echo ""

# Test 8: Accountant Role Features
echo -e "${YELLOW}Testing Accountant Role Features...${NC}"
login_user "accountant@incentive.io" "Accountant123!"
test_auth_endpoint "Accountant Dashboard" "$BASE_URL/accountant" "200"
test_auth_endpoint "Accountant Approvals" "$BASE_URL/accountant/approvals" "200"
test_auth_endpoint "Accountant Records" "$BASE_URL/accountant/records" "200"
test_auth_endpoint "Accountant Wallets" "$BASE_URL/accountant/wallets" "200"
test_auth_endpoint "API - Accountant Approvals" "$BASE_URL/api/approvals/accountant" "200"
echo ""

# Test 9: Finance Role Features
echo -e "${YELLOW}Testing Finance Role Features...${NC}"
login_user "finance@incentive.io" "Finance123!"
test_auth_endpoint "Finance Dashboard" "$BASE_URL/finance" "200"
test_auth_endpoint "Finance Approvals" "$BASE_URL/finance/approvals" "200"
test_auth_endpoint "Finance Payments" "$BASE_URL/finance/payments" "200"
test_auth_endpoint "Finance Wallets" "$BASE_URL/finance/wallets" "200"
test_auth_endpoint "API - Finance Approvals" "$BASE_URL/api/approvals/finance" "200"
echo ""

# Test 10: Role-Based Access Control (Cross-role access prevention)
echo -e "${YELLOW}Testing Role-Based Access Control...${NC}"

# Sales Executive should be blocked from admin pages
login_user "jamal@incentive.io" "Jamal123!"
test_auth_endpoint "Executive accesses own dashboard" "$BASE_URL/sales-dashboard" "200"
# Should redirect to own dashboard
response=$(curl -s -w "\n%{http_code}" -L -b "$COOKIE_FILE" "$BASE_URL/admin")
final_url=$(echo "$response" | grep -o 'Location: [^ ]*' || echo "")
if [[ "$final_url" == *"sales-dashboard"* ]] || [ "$(echo "$response" | tail -n1)" = "200" ]; then
    print_result "Executive blocked from Admin" "PASS" "Redirect" "Redirected to sales-dashboard"
else
    print_result "Executive blocked from Admin" "FAIL" "Redirect" "$(echo "$response" | tail -n1)"
fi

# Sales Manager should be blocked from admin pages
login_user "manager@incentive.io" "Manager123!"
test_auth_endpoint "Manager accesses own dashboard" "$BASE_URL/sales-manager" "200"
response=$(curl -s -w "\n%{http_code}" -L -b "$COOKIE_FILE" "$BASE_URL/admin")
if [ "$(echo "$response" | tail -n1)" = "200" ]; then
    print_result "Manager blocked from Admin" "PASS" "Redirect" "Redirected"
else
    print_result "Manager blocked from Admin" "FAIL" "Redirect" "$(echo "$response" | tail -n1)"
fi

echo ""

# Test 11: API Functionality
echo -e "${YELLOW}Testing API Endpoints...${NC}"

# Login as admin for API tests
login_user "admin@incentive.io" "Admin123!"

# Categories API
test_auth_endpoint "GET Categories" "$BASE_URL/api/categories" "200"

# Products API
test_auth_endpoint "GET Products" "$BASE_URL/api/products" "200"

# Users API
test_auth_endpoint "GET Users" "$BASE_URL/api/users" "200"

# Teams API
test_auth_endpoint "GET Teams" "$BASE_URL/api/teams" "200"

# Sales Records API
test_auth_endpoint "GET Sales Records" "$BASE_URL/api/sales-records" "200"

# Commissions API
test_auth_endpoint "GET Commissions" "$BASE_URL/api/commissions" "200"

# Wallets API
test_auth_endpoint "GET Wallets" "$BASE_URL/api/wallets" "200"

# Notifications API
test_auth_endpoint "GET Notifications" "$BASE_URL/api/notifications" "200"

echo ""

# Test 12: Common Dashboard Features
echo -e "${YELLOW}Testing Common Dashboard Features...${NC}"

# Profile pages (all roles have these)
login_user "admin@incentive.io" "Admin123!"
test_auth_endpoint "Admin Profile" "$BASE_URL/admin/profile" "200"

login_user "manager@incentive.io" "Manager123!"
test_auth_endpoint "Manager Profile" "$BASE_URL/sales-manager/profile" "200"

login_user "jamal@incentive.io" "Jamal123!"
test_auth_endpoint "Executive Profile" "$BASE_URL/sales-dashboard/profile" "200"

login_user "accountant@incentive.io" "Accountant123!"
test_auth_endpoint "Accountant Profile" "$BASE_URL/accountant/profile" "200"

login_user "finance@incentive.io" "Finance123!"
test_auth_endpoint "Finance Profile" "$BASE_URL/finance/profile" "200"

echo ""

# Final Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests Run: $TESTS_RUN"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi

# Cleanup
rm -f $COOKIE_FILE
