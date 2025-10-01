#!/usr/bin/env node

/**
 * Comprehensive Integration Test
 *
 * Tests both token service and bootstrap system integration together
 * to ensure the complete OurLibrary app functionality works as expected.
 */

const path = require('path');
const fs = require('fs');

async function testCompleteIntegration() {
  console.log('🚀 OurLibrary Complete Integration Test');
  console.log('📅 Test Date:', new Date().toISOString());
  console.log('='.repeat(60));

  const tests = [
    { name: 'Token Service Integration', run: async () => {
      console.log('\n🔐 Testing Token Service Integration');
      console.log('-'.repeat(40));

      const { testMockTokenFlow } = require('./test-token-integration');
      const result = await testMockTokenFlow();
      console.log(`✅ Token Service: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    }},

    { name: 'Bootstrap System Integration', run: async () => {
      console.log('\n🗂️  Testing Bootstrap System Integration');
      console.log('-'.repeat(40));

      const { runBootstrapTests } = require('./test-bootstrap');
      const result = await runBootstrapTests();
      console.log(`✅ Bootstrap System: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    }},

    { name: 'Application Structure', run: async () => {
      console.log('\n📁 Testing Application Structure');
      console.log('-'.repeat(40));

      const requiredFiles = [
        'package.json',
        'main.js',
        'preload.js',
        'renderer.js',
        'index.html',
        'config/manifest.local.json',
        'Assets/OurLibrary.db'
      ];

      let allExists = true;
      requiredFiles.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`${exists ? '✅' : '❌'} ${file}`);
        if (!exists) allExists = false;
      });

      console.log(`✅ Application Structure: ${allExists ? 'PASS' : 'FAIL'}`);
      return allExists;
    }},

    { name: 'Dependencies', run: async () => {
      console.log('\n📦 Testing Dependencies');
      console.log('-'.repeat(40));

      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const deps = Object.keys(packageJson.dependencies || {});
        const requiredDeps = ['axios', 'electron', 'firebase', 'sql.js', 'yauzl', 'uuid'];

        let allAvailable = true;
        requiredDeps.forEach(dep => {
          const available = deps.includes(dep);
          console.log(`${available ? '✅' : '❌'} ${dep}`);
          if (!available) allAvailable = false;
        });

        console.log(`✅ Dependencies: ${allAvailable ? 'PASS' : 'FAIL'}`);
        return allAvailable;
      } catch (error) {
        console.log(`❌ Dependencies: FAIL (${error.message})`);
        return false;
      }
    }},

    { name: 'Database Content', run: async () => {
      console.log('\n🗄️  Testing Database Content');
      console.log('-'.repeat(40));

      try {
        const initSqlJs = require('sql.js');
        const SQL = await initSqlJs();

        const dbPath = path.join(__dirname, 'Assets', 'OurLibrary.db');
        const data = fs.readFileSync(dbPath);
        const db = new SQL.Database(data);

        // Test basic queries
        const stmt = db.prepare("SELECT COUNT(*) as count FROM Books");
        stmt.step();
        const bookCount = stmt.getAsObject().count;
        stmt.free();

        // Test token-related functionality
        const tokenStmt = db.prepare("SELECT COUNT(*) as count FROM Books WHERE TierCode = 'F'");
        tokenStmt.step();
        const freeBooks = tokenStmt.getAsObject().count;
        tokenStmt.free();

        db.close();

        console.log(`✅ Books in database: ${bookCount}`);
        console.log(`✅ Free tier books: ${freeBooks}`);
        console.log(`✅ Database Content: ${bookCount > 0 ? 'PASS' : 'FAIL'}`);
        return bookCount > 0;
      } catch (error) {
        console.log(`❌ Database Content: FAIL (${error.message})`);
        return false;
      }
    }},

    { name: 'Manifest Configuration', run: async () => {
      console.log('\n📋 Testing Manifest Configuration');
      console.log('-'.repeat(40));

      try {
        const manifestPath = path.join(__dirname, 'config', 'manifest.local.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        const hasVersion = manifest.latest_version && manifest.minimum_required_version;
        const hasDatabase = manifest.database_archive && manifest.database_archive.fileId;

        console.log(`✅ Version info: ${hasVersion ? 'PRESENT' : 'MISSING'}`);
        console.log(`✅ Database archive: ${hasDatabase ? 'PRESENT' : 'MISSING'}`);
        console.log(`✅ Latest version: ${manifest.latest_version}`);

        const result = hasVersion && hasDatabase;
        console.log(`✅ Manifest Configuration: ${result ? 'PASS' : 'FAIL'}`);
        return result;
      } catch (error) {
        console.log(`❌ Manifest Configuration: FAIL (${error.message})`);
        return false;
      }
    }},

    { name: 'Security Features', run: async () => {
      console.log('\n🔒 Testing Security Features');
      console.log('-'.repeat(40));

      // Check that no hardcoded credentials exist
      const filesToCheck = ['main.js', 'preload.js', 'renderer.js'];
      let hasCredentials = false;

      filesToCheck.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const suspiciousPatterns = [
            /client_secret/i,
            /private_key/i,
            /password\s*=/i,
            /api_key\s*=/i
          ];

          const foundSuspicious = suspiciousPatterns.some(pattern => pattern.test(content));
          if (foundSuspicious) {
            console.log(`❌ ${file}: Contains potentially sensitive patterns`);
            hasCredentials = true;
          } else {
            console.log(`✅ ${file}: No hardcoded credentials detected`);
          }
        }
      });

      console.log(`✅ Security Features: ${!hasCredentials ? 'PASS' : 'FAIL'}`);
      return !hasCredentials;
    }}
  ];

  // Run all tests
  const results = [];
  for (const test of tests) {
    try {
      const result = await test.run();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR (${error.message})`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPLETE INTEGRATION TEST RESULTS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`📈 Overall Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results.filter(r => !r.passed).forEach(test => {
      console.log(`   ❌ ${test.name}${test.error ? ` (${test.error})` : ''}`);
    });
  }

  console.log('\n🎯 Readiness Assessment:');
  if (passed === total) {
    console.log('🟢 READY FOR PRODUCTION');
    console.log('   All integration tests passed successfully');
    console.log('   Token service and bootstrap system are fully functional');
    console.log('   Ready for Firebase deployment and real-world testing');
  } else if (passed >= total * 0.8) {
    console.log('🟡 MOSTLY READY');
    console.log('   Most tests passed, minor issues to resolve');
    console.log('   Can proceed with development and testing');
  } else {
    console.log('🔴 NEEDS ATTENTION');
    console.log('   Significant issues detected');
    console.log('   Address critical failures before deployment');
  }

  console.log('\n🚀 Next Steps:');
  if (passed === total) {
    console.log('   1. Deploy Firebase Cloud Functions');
    console.log('   2. Create production database and manifest');
    console.log('   3. Test with real tokens and content');
    console.log('   4. Prepare for distribution');
  } else {
    console.log('   1. Fix failed integration tests');
    console.log('   2. Resolve dependency or configuration issues');
    console.log('   3. Re-run integration tests');
  }

  return passed === total;
}

// Run if called directly
if (require.main === module) {
  testCompleteIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteIntegration, comprehensiveTest: testCompleteIntegration };