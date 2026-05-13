# Browser Automation Tests

This directory contains automated browser tests using **agent-browser** for the Incentive.io sales commission management system.

## Prerequisites

1. **Install agent-browser:**
   ```bash
   npm i -g agent-browser
   agent-browser install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Ensure MongoDB is running:**
   ```bash
   # MongoDB should be running at mongodb://localhost:27017/incentiveio
   ```

## Test Accounts

The tests use these pre-configured accounts:

| Email | Password | Role |
|-------|----------|------|
| jamal@incentive.io | Jamal123! | Sales Executive |
| admin@incentive.io | Admin123! | Admin |
| manager@incentive.io | Manager123! | Sales Manager |
| accountant@incentive.io | Accountant123! | Accountant |
| finance@incentive.io | Finance123! | Finance |

## Running Tests

### Option 1: Bash Script (Linux/Mac/WSL)

```bash
# Make executable (first time only)
chmod +x tests/browser/test-flows.sh

# Run all tests
./tests/browser/test-flows.sh

# Run specific test (edit the script to comment out other tests)
```

### Option 2: Manual Commands

Run tests individually using agent-browser commands:

```bash
# Test 1: Health Check
curl http://localhost:3000/api/health

# Test 2: Homepage
agent-browser open http://localhost:3000
agent-browser screenshot tests/browser/screenshots/homepage.png
agent-browser close

# Test 3: Login
agent-browser open http://localhost:3000/login
agent-browser fill 'input[name="email"]' "jamal@incentive.io"
agent-browser fill 'input[name="password"]' "Jamal123!"
agent-browser click 'button[type="submit"]'
agent-browser wait --url "**/sales-dashboard"
agent-browser screenshot tests/browser/screenshots/dashboard.png
agent-browser close
```

## Test Coverage

The test suite covers:

1. ✅ **Health Check** - Verifies server is running
2. ✅ **Homepage Load** - Checks homepage renders correctly
3. ✅ **User Registration** - Tests new user signup flow
4. ✅ **User Login** - Validates authentication for all roles
5. ✅ **Sales Executive Dashboard** - Tests sales executive UI
6. ✅ **Admin Dashboard** - Tests admin management UI
7. ✅ **Manager Dashboard** - Tests sales manager approval UI
8. ✅ **Accountant Dashboard** - Tests accountant processing UI
9. ✅ **Finance Dashboard** - Tests finance approval UI
10. ✅ **Create Sales Record** - Tests sales record creation flow

## Screenshots

All screenshots are saved to `tests/browser/screenshots/` with timestamps:
- `20240514_143022_homepage.png`
- `20240514_143025_dashboard.png`
- etc.

## Troubleshooting

### Issue: "agent-browser: command not found"
**Solution:** Install agent-browser globally:
```bash
npm i -g agent-browser && agent-browser install
```

### Issue: Tests fail with "Server not running"
**Solution:** Start the development server:
```bash
npm run dev
```

### Issue: Tests timeout
**Solution:** Check if the server is running slowly. Increase timeout in test script.

### Issue: Screenshots not saving
**Solution:** Create the screenshots directory:
```bash
mkdir -p tests/browser/screenshots
```

## Continuous Integration

To run these tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Start server
  run: npm run dev &

- name: Wait for server
  run: sleep 10

- name: Run browser tests
  run: ./tests/browser/test-flows.sh
```

## Adding New Tests

To add a new test:

1. Create a new test function in `test-flows.sh`:
   ```bash
   test_my_new_feature() {
       echo "Testing My New Feature..."
       agent-browser open "$BASE_URL/my-feature"
       agent-browser wait --load networkidle
       # ... test steps ...
       agent-browser close
       return 0  # 0 = pass, 1 = fail
   }
   ```

2. Add it to the main function:
   ```bash
   run_test "My New Feature" test_my_new_feature
   ```

3. Run the tests to verify

## Resources

- [agent-browser Documentation](https://github.com/optionalg/agent-browser)
- [Skills Integration Plan](../../SKILLS_INTEGRATION_PLAN.md)
- [CLAUDE.md](../../CLAUDE.md) - Project documentation
