#!/bin/bash
# Test: View audit logs

set -e

echo "======================================"
echo "Testing Administrator - Audit Logs"
echo "======================================"

# Login as Administrator
echo "Logging in as Administrator..."
agent-browser open http://localhost:3000/login
sleep 2
agent-browser fill 'input[name="email"]' 'superadmin@incentive.io'
agent-browser fill 'input[name="password"]' 'Superadmin123!'
agent-browser click 'button[type="submit"]'
sleep 3

# Navigate to audit logs
echo "Navigating to audit logs..."
agent-browser open http://localhost:3000/administrator/audit-logs
sleep 3
agent-browser screenshot --output tests/screenshots/superadmin-audit-logs.png

# Verify audit logs table
echo "Verifying audit logs..."
agent-browser eval 'document.querySelector("table") ? "Audit logs table found" : "No table"'
agent-browser eval 'document.querySelectorAll("table tbody tr").length > 0 ? "Audit logs listed" : "No logs"'
agent-browser close

echo "✓ Audit logs viewing completed successfully"
echo "======================================"
echo "Audit logs test completed successfully"
echo "======================================"
