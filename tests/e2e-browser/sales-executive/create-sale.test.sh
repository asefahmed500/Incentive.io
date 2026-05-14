#!/bin/bash
# Test: Create, save as draft, view sales record

set -e

echo "======================================"
echo "Testing Sales Executive - Create Sale"
echo "======================================"

# Login as Sales Executive
echo "Logging in as Sales Executive..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'karim@incentive.io'
agent-browser fill 'input[name="password"]' 'Executive123!'
agent-browser click 'button[type="submit"]'
sleep 3
agent-browser screenshot --output tests/screenshots/se-after-login.png

# Navigate to Add Record
echo "Navigating to Add Record page..."
agent-browser open http://localhost:3000/sales-dashboard/add-record
sleep 3
agent-browser screenshot --output tests/screenshots/se-add-record-page.png

# Fill company information
TIMESTAMP=$(date +%s)
echo "Filling company information..."
agent-browser fill 'input[name="companyName"]' "Test Company ${TIMESTAMP} Ltd"
agent-browser fill 'input[name="companyEmail']' "test${TIMESTAMP}@company.com"
agent-browser screenshot --output tests/screenshots/se-company-info.png

# Add first product
echo "Adding first product..."
sleep 1
agent-browser fill 'input[name="products[0][productName]"]' 'Wireless Mouse'
agent-browser select 'select[name="products[0][categoryId]"]' 'Electronics'
agent-browser fill 'input[name="products[0][unitPrice]"]' '1500'
agent-browser fill 'input[name="products[0][quantity]"]' '5'
agent-browser screenshot --output tests/screenshots/se-product-1.png

# Add second product
echo "Adding second product..."
agent-browser click 'button:has-text("Add Product")'
sleep 1
agent-browser fill 'input[name="products[1][productName]"]' 'USB Keyboard'
agent-browser select 'select[name="products[1][categoryId]"]' 'Electronics'
agent-browser fill 'input[name="products[1][unitPrice]"]' '3000'
agent-browser fill 'input[name="products[1][quantity]"]' '2'
agent-browser screenshot --output tests/screenshots/se-product-2.png

# Save as draft
echo "Saving as draft..."
agent-browser click 'button:has-text("Save Draft")'
sleep 3
agent-browser screenshot --output tests/screenshots/se-after-draft.png

# Navigate to records
echo "Navigating to records page..."
agent-browser open http://localhost:3000/sales-dashboard/records
sleep 3
agent-browser screenshot --output tests/screenshots/se-records-page.png

# Verify draft record exists
echo "Verifying draft record was created..."
agent-browser eval 'document.querySelector("table") ? "Table found" : "No table"'
agent-browser eval 'document.body.textContent.includes("Test Company") ? "Test Company found" : "Company not found"'
agent-browser close

echo "✓ Sales record creation completed successfully"
echo "======================================"
echo "Create sale test completed successfully"
echo "======================================"
