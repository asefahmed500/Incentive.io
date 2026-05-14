#!/bin/bash
# Comprehensive E2E Test Runner for Incentive.io

set -e

echo "======================================"
echo "Incentive.io E2E Test Suite"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check if MongoDB is running
if ! mongosh --quiet mongodb://localhost:27017/incentiveio --eval 'db.serverStatus().ok' > /dev/null 2>&1; then
  print_status "$RED" "✗ MongoDB is not running"
  echo "Please start MongoDB and try again"
  exit 1
fi
print_status "$GREEN" "✓ MongoDB is running"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  print_status "$YELLOW" "⚠ .env.local not found, copying from .env.example"
  cp .env.example .env.local
fi
print_status "$GREEN" "✓ Environment file found"

# Check if node_modules exists
if [ ! -d node_modules ]; then
  print_status "$YELLOW" "⚠ Dependencies not installed, running npm install..."
  npm install
fi
print_status "$GREEN" "✓ Dependencies installed"

# Check if Playwright is installed
if ! npx playwright --version > /dev/null 2>&1; then
  print_status "$YELLOW" "⚠ Playwright not installed, installing..."
  npx playwright install
fi
print_status "$GREEN" "✓ Playwright installed"

# Ask user what to run
echo ""
echo "What would you like to run?"
echo "1) All E2E tests (headless)"
echo "2) All E2E tests (headed - watch browser)"
echo "3) E2E tests with UI mode"
echo "4) Specific test suite"
echo "5) Database verification only"
echo "6) Exit"
read -p "Enter choice (1-6): " choice

case $choice in
  1)
    print_status "$GREEN" "Running all E2E tests..."
    npm run test:e2e
    ;;
  2)
    print_status "$GREEN" "Running all E2E tests in headed mode..."
    npm run test:e2e:headed
    ;;
  3)
    print_status "$GREEN" "Running E2E tests with UI mode..."
    npm run test:e2e:ui
    ;;
  4)
    echo ""
    echo "Available test suites:"
    echo "1) Authentication (login, logout)"
    echo "2) Sales Executive (dashboard, create sale)"
    echo "3) Sales Manager (approvals)"
    echo "4) Accountant (processing)"
    echo "5) Finance (final approval)"
    echo "6) Admin (user management)"
    echo "7) Administrator (audit logs)"
    echo "8) UI/UX (RBAC, responsive)"
    read -p "Enter choice (1-8): " suite_choice

    case $suite_choice in
      1) npx playwright test specs/auth/ ;;
      2) npx playwright test specs/sales-executive/ ;;
      3) npx playwright test specs/sales-manager/ ;;
      4) npx playwright test specs/accountant/ ;;
      5) npx playwright test specs/finance/ ;;
      6) npx playwright test specs/admin/ ;;
      7) npx playwright test specs/administrator/ ;;
      8) npx playwright test specs/ui/ ;;
      *) echo "Invalid choice" ;;
    esac
    ;;
  5)
    print_status "$GREEN" "Running database verification..."
    bash tests/e2e-browser/database/verify-data.test.sh
    ;;
  6)
    print_status "$YELLOW" "Exiting..."
    exit 0
    ;;
  *)
    print_status "$RED" "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "======================================"
if [ $? -eq 0 ]; then
  print_status "$GREEN" "✓ Tests completed successfully"
  echo "View the report: npm run test:e2e:report"
else
  print_status "$RED" "✗ Tests failed"
  echo "Check the screenshots in tests/e2e/screenshots/"
fi
echo "======================================"
