#!/bin/bash
# Test: Verify data persistence in MongoDB

set -e

echo "======================================"
echo "Testing Database Verification"
echo "======================================"

# Check MongoDB connection
echo "Checking MongoDB connection..."
mongosh --quiet mongodb://localhost:27017/incentiveio --eval 'db.serverStatus().ok' 2>/dev/null || {
  echo "MongoDB is not running. Starting MongoDB..."
  echo "Please start MongoDB manually and retry this test."
  exit 1
}

# Check user exists
echo "Verifying test users exist..."
mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.users.findOne({ email: "karim@incentive.io", deletedAt: null }, { name: 1, email: 1, role: 1, _id: 0 })
'
echo "✓ Sales Executive user found"

# Check sales records
echo "Verifying sales records..."
RECORD_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.salesrecords.countDocuments({ deletedAt: null })
')
echo "✓ Found $RECORD_COUNT sales records"

# Check wallet balances
echo "Verifying wallet data..."
WALLET_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.wallets.countDocuments({ deletedAt: null })
')
echo "✓ Found $WALLET_COUNT wallets"

# Check categories
echo "Verifying categories..."
CATEGORY_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.categories.countDocuments({ deletedAt: null })
')
echo "✓ Found $CATEGORY_COUNT categories"

# Check products
echo "Verifying products..."
PRODUCT_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.products.countDocuments({ deletedAt: null })
')
echo "✓ Found $PRODUCT_COUNT products"

# Check commission rules
echo "Verifying commission rules..."
RULE_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.commissionrules.countDocuments({ deletedAt: null })
')
echo "✓ Found $RULE_COUNT commission rules"

# Check teams
echo "Verifying teams..."
TEAM_COUNT=$(mongosh --quiet mongodb://localhost:27017/incentiveio --eval '
  db.teams.countDocuments({ deletedAt: null })
')
echo "✓ Found $TEAM_COUNT teams"

echo "======================================"
echo "Database verification completed successfully"
echo "======================================"
