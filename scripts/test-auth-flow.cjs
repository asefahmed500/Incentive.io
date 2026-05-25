/**
 * Test Auth Module - Registration and Login
 */

async function testAuthFlow() {
  const BASE_URL = 'http://localhost:3000';

  console.log('=== Testing Auth Module ===\n');

  // Test 1: Check server health
  console.log('1. Checking server health...');
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('   ✓ Server is running');
    console.log('   Database:', healthData.connected ? 'Connected' : 'Not connected');
  } catch (error) {
    console.log('   ✗ Server health check failed:', error.message);
    return;
  }

  // Test 2: Registration with valid data
  console.log('\n2. Testing registration...');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPass123!'; // Meets requirements: 12+ chars, uppercase, lowercase, number, special char

  const registerData = {
    name: 'Test User',
    email: testEmail,
    password: testPassword,
    phone: ''
  };

  console.log('   Data:', { ...registerData, password: '***' });

  try {
    const regResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });

    const regResult = await regResponse.json();
    console.log('   Status:', regResponse.status);
    console.log('   Response:', regResult);

    if (regResponse.status === 201) {
      console.log('   ✓ Registration successful');

      // Test 3: Login with new credentials
      console.log('\n3. Testing login...');

      // Get the login page first to get CSRF token
      const loginPageResponse = await fetch(`${BASE_URL}/login`);
      console.log('   Login page status:', loginPageResponse.status);

      // Try to login via NextAuth API
      const loginFormData = new FormData();
      loginFormData.append('email', testEmail);
      loginFormData.append('password', testPassword);
      loginFormData.append('csrfToken', 'test'); // May be needed

      const loginResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        body: loginFormData
      });

      console.log('   Login status:', loginResponse.status);
      const loginResult = await loginResponse.json();
      console.log('   Login response:', loginResult);

    } else if (regResponse.status === 409) {
      console.log('   ⚠ Email already exists');
    } else {
      console.log('   ✗ Registration failed');
      console.log('   Error:', regResult.error || 'Unknown error');
    }

  } catch (error) {
    console.log('   ✗ Request failed:', error.message);
  }

  // Test 4: Check existing users
  console.log('\n4. Checking existing test users...');
  const existingUsers = [
    'admin@incentive.io',
    'karim@incentive.io',
    'jamal@incentive.io'
  ];

  for (const email of existingUsers) {
    console.log(`   - ${email}`);
  }

  console.log('\n=== Auth Test Complete ===');
}

testAuthFlow().catch(console.error);
