#!/usr/bin/env node

/**
 * Backend API Testing Script
 * Usage: node test-api.js [base_url]
 * Example: node test-api.js https://your-app.railway.app
 *          node test-api.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const WALLET_ADDRESS = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const USERNAME = `testuser${Date.now()}`;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ ${name} passed`, 'green');
      console.log(JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      log(`❌ ${name} failed (${response.status})`, 'red');
      console.log(JSON.stringify(data, null, 2));
      return { success: false, data };
    }
  } catch (error) {
    log(`❌ ${name} failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🧪 Testing Backend API', 'yellow');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  log(`Wallet Address: ${WALLET_ADDRESS}`, 'yellow');
  log(`Username: ${USERNAME}`, 'yellow');
  log('');

  // Test 1: Health Check
  log('\n📋 Test 1: Health Check', 'yellow');
  await testEndpoint('Health Check', 'GET', '/health');

  // Test 2: Check Username Availability
  log('\n📋 Test 2: Check Username Availability', 'yellow');
  await testEndpoint('Username Check', 'GET', `/api/users/username/check?username=${USERNAME}`);

  // Test 3: Register Username
  log('\n📋 Test 3: Register Username', 'yellow');
  const registerResult = await testEndpoint('Register Username', 'POST', '/api/users/username', {
    userAddress: WALLET_ADDRESS,
    username: USERNAME,
  });

  // Test 4: Get User Profile
  log('\n📋 Test 4: Get User Profile', 'yellow');
  await testEndpoint('Get Profile', 'GET', `/api/users/${WALLET_ADDRESS}`);

  // Test 5: Get Public Groups
  log('\n📋 Test 5: Get Public Groups', 'yellow');
  const groupsResult = await testEndpoint('Get Groups', 'GET', '/api/groups/public');

  log('\n✅ Testing complete!', 'green');
  log('\n📝 Next Steps:', 'yellow');
  log('1. Test creating a group (requires payment signature)', 'yellow');
  log('2. Test joining a group', 'yellow');
  log('3. Test sending messages', 'yellow');
  log('\nSee TESTING_GUIDE.md for more examples', 'yellow');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('Error: This script requires Node.js 18+ or a fetch polyfill');
  console.log('Install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);

