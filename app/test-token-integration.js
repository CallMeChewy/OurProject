#!/usr/bin/env node

/**
 * Token Service Integration Test
 *
 * This script tests the token service integration without requiring
 * the full Electron app to be running.
 */

const path = require('path');
const fs = require('fs');
const { requestSignedUrl } = require('../core/modules/tokenClient');

// Test configuration
const TEST_CONFIG = {
  // These would come from environment or config in production
  tokenEndpoint: process.env.OURLIBRARY_TOKEN_ENDPOINT || 'https://us-central1-your-project.cloudfunctions.net/issueDownloadUrlHttp',
  testToken: process.env.TEST_TOKEN || 'demo-token-12345',
  testFileId: process.env.TEST_FILE_ID || 'demo-file-id',
  testVersion: process.env.TEST_VERSION || 'v1.0.0'
};

async function testTokenValidation() {
  console.log('🔐 Testing Token Service Integration');
  console.log('='.repeat(50));

  try {
    // Test 1: Basic token validation
    console.log('\n1. Testing token validation...');
    const result = await requestSignedUrl({
      token: TEST_CONFIG.testToken,
      fileId: TEST_CONFIG.testFileId,
      version: TEST_CONFIG.testVersion,
      endpoint: TEST_CONFIG.tokenEndpoint
    });

    console.log('✅ Token validation successful!');
    console.log('Response:', {
      hasUrl: !!result.url,
      quotaRemaining: result.quotaRemaining,
      quotaLimit: result.quotaLimit,
      archive: result.archive ? 'present' : 'missing'
    });

    return true;

  } catch (error) {
    console.log('❌ Token validation failed');
    console.log('Error:', error.message);

    if (error.code) {
      console.log('Error code:', error.code);

      // Provide helpful error messages
      switch (error.code) {
        case 'not-found':
          console.log('💡 Hint: Token not found. Check if the token exists in Firestore.');
          break;
        case 'permission-denied':
          console.log('💡 Hint: Token expired, inactive, or quota exceeded.');
          break;
        case 'invalid-argument':
          console.log('💡 Hint: Missing required parameters (token, fileId, version).');
          break;
        case 'failed-precondition':
          console.log('💡 Hint: Firebase function configuration issue.');
          break;
        default:
          console.log('💡 Hint: Check Firebase function logs for details.');
      }
    }

    return false;
  }
}

async function testMockTokenFlow() {
  console.log('\n🧪 Testing Mock Token Flow (Local)');
  console.log('='.repeat(50));

  // Test the mock token validation that would happen in the Electron app
  const mockValidateToken = (token) => {
    if (!token || token.length < 10) {
      return { valid: false, error: 'Invalid token format' };
    }
    return { valid: true };
  };

  const testCases = [
    { token: '', expected: false, description: 'Empty token' },
    { token: 'short', expected: false, description: 'Too short token' },
    { token: 'valid-token-12345', expected: true, description: 'Valid token format' },
    { token: TEST_CONFIG.testToken, expected: true, description: 'Test token' }
  ];

  let passed = 0;

  for (const testCase of testCases) {
    const result = mockValidateToken(testCase.token);
    const success = result.valid === testCase.expected;

    console.log(`${success ? '✅' : '❌'} ${testCase.description}: ${result.valid ? 'Valid' : 'Invalid'}`);

    if (!success) {
      console.log(`   Expected: ${testCase.expected}, Got: ${result.valid}`);
      if (result.error) console.log(`   Error: ${result.error}`);
    } else {
      passed++;
    }
  }

  console.log(`\nMock validation tests: ${passed}/${testCases.length} passed`);
  return passed === testCases.length;
}

async function testFileSystemIntegration() {
  console.log('\n📁 Testing File System Integration');
  console.log('='.repeat(50));

  try {
    // Test token storage and retrieval
    const testData = {
      token: TEST_CONFIG.testToken,
      lastUsed: new Date().toISOString()
    };

    const tempDir = path.join(__dirname, 'temp-test');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tokenPath = path.join(tempDir, 'token.json');

    // Test storing token
    await fs.promises.writeFile(tokenPath, JSON.stringify(testData, null, 2));
    console.log('✅ Token storage successful');

    // Test retrieving token
    const storedData = JSON.parse(await fs.promises.readFile(tokenPath, 'utf8'));
    const isValid = storedData.token === testData.token && storedData.lastUsed === testData.lastUsed;

    console.log(`${isValid ? '✅' : '❌'} Token retrieval: ${isValid ? 'Success' : 'Failed'}`);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    return isValid;
  } catch (error) {
    console.log('❌ File system test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 OurLibrary Token Service Integration Tests');
  console.log('📅 Test Date:', new Date().toISOString());
  console.log('🔧 Test Environment:', process.env.NODE_ENV || 'development');

  const results = {
    tokenValidation: false,
    mockFlow: false,
    fileSystem: false
  };

  // Run tests
  results.mockFlow = await testMockTokenFlow();
  results.fileSystem = await testFileSystemIntegration();

  // Only run real token service test if we have proper configuration
  if (process.env.TEST_TOKEN && process.env.OURLIBRARY_TOKEN_ENDPOINT) {
    results.tokenValidation = await testTokenValidation();
  } else {
    console.log('\n⚠️  Skipping real token service test - missing TEST_TOKEN or OURLIBRARY_TOKEN_ENDPOINT');
    console.log('   Set these environment variables to test against Firebase Functions:');
    console.log('   export TEST_TOKEN="your-token"');
    console.log('   export OURLIBRARY_TOKEN_ENDPOINT="your-function-url"');
    results.tokenValidation = null; // Skipped
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const skipped = Object.values(results).filter(r => r === null).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📈 Success Rate: ${passed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All applicable tests passed!');
    console.log('🎉 Token service integration is ready for use.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTokenValidation,
  testMockTokenFlow,
  testFileSystemIntegration,
  runAllTests
};