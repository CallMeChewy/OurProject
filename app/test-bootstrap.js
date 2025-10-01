#!/usr/bin/env node

/**
 * Bootstrap System Integration Test
 *
 * Tests the bootstrap system integration with the Electron app
 * including file system initialization, database loading, and manifest handling.
 */

const path = require('path');
const fs = require('fs');

async function testFileSystemOperations() {
  console.log('🗂️  Testing File System Operations');
  console.log('='.repeat(50));

  try {
    // Test database file exists
    const dbPath = path.join(__dirname, 'Assets', 'OurLibrary.db');
    if (fs.existsSync(dbPath)) {
      console.log('✅ Test database file exists:', dbPath);

      const stats = fs.statSync(dbPath);
      console.log(`   File size: ${Math.round(stats.size / 1024)} KB`);
      console.log(`   Created: ${stats.birthtime.toISOString()}`);
    } else {
      console.log('❌ Test database file not found');
      return false;
    }

    // Test manifest file exists
    const manifestPath = path.join(__dirname, 'config', 'manifest.local.json');
    if (fs.existsSync(manifestPath)) {
      console.log('✅ Local manifest file exists:', manifestPath);

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`   Latest version: ${manifest.latest_version}`);
      console.log(`   Database archive: ${manifest.database_archive.fileId}`);
    } else {
      console.log('❌ Local manifest file not found');
      return false;
    }

    // Test config directory structure
    const configDir = path.join(__dirname, 'config');
    const assetsDir = path.join(__dirname, 'Assets');

    console.log('✅ Directory structure:');
    console.log(`   Config dir: ${configDir} ${fs.existsSync(configDir) ? '✅' : '❌'}`);
    console.log(`   Assets dir: ${assetsDir} ${fs.existsSync(assetsDir) ? '✅' : '❌'}`);

    return true;
  } catch (error) {
    console.error('❌ File system test failed:', error.message);
    return false;
  }
}

async function testDatabaseIntegrity() {
  console.log('\n🗄️  Testing Database Integrity');
  console.log('='.repeat(50));

  try {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();

    const dbPath = path.join(__dirname, 'Assets', 'OurLibrary.db');
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);

    // Test metadata table
    let stmt = db.prepare("SELECT key, value FROM DatabaseMetadata");
    let metadata = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      metadata[row.key] = row.value;
    }
    stmt.free();

    console.log('✅ Database metadata:');
    Object.entries(metadata).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    // Test categories table
    stmt = db.prepare("SELECT COUNT(*) as count FROM Categories");
    const categoryCount = stmt.getAsObject().count;
    stmt.free();
    console.log(`✅ Categories: ${categoryCount}`);

    // Test subjects table
    stmt = db.prepare("SELECT COUNT(*) as count FROM Subjects");
    const subjectCount = stmt.getAsObject().count;
    stmt.free();
    console.log(`✅ Subjects: ${subjectCount}`);

    // Test books table
    stmt = db.prepare("SELECT COUNT(*) as count FROM Books");
    const bookCount = stmt.getAsObject().count;
    stmt.free();
    console.log(`✅ Books: ${bookCount}`);

    // Test a sample query
    stmt = db.prepare("SELECT Title, Author, TierCode FROM Books WHERE TierCode = 'F' LIMIT 3");
    console.log('✅ Sample free tier books:');
    while (stmt.step()) {
      const book = stmt.getAsObject();
      console.log(`   - ${book.Title} by ${book.Author}`);
    }
    stmt.free();

    db.close();
    return true;
  } catch (error) {
    console.error('❌ Database integrity test failed:', error.message);
    return false;
  }
}

async function testManifestParsing() {
  console.log('\n📋 Testing Manifest Parsing');
  console.log('='.repeat(50));

  try {
    const manifestPath = path.join(__dirname, 'config', 'manifest.local.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Required fields
    const requiredFields = ['latest_version', 'minimum_required_version', 'database_archive'];
    let allValid = true;

    requiredFields.forEach(field => {
      if (manifest[field] !== undefined && manifest[field] !== null) {
        console.log(`✅ ${field}: ${JSON.stringify(manifest[field])}`);
      } else {
        console.log(`❌ ${field}: Missing or null`);
        allValid = false;
      }
    });

    // Test database archive structure
    if (manifest.database_archive) {
      const archive = manifest.database_archive;
      const archiveFields = ['fileId', 'version', 'size', 'contentType'];

      console.log('✅ Database archive details:');
      archiveFields.forEach(field => {
        if (archive[field]) {
          console.log(`   ${field}: ${archive[field]}`);
        }
      });
    }

    return allValid;
  } catch (error) {
    console.error('❌ Manifest parsing test failed:', error.message);
    return false;
  }
}

async function testBootstrapIntegration() {
  console.log('\n🚀 Testing Bootstrap Integration');
  console.log('='.repeat(50));

  try {
    // Test if we can load the Bootstrap class
    const Bootstrap = require('../core/bootstrap');
    console.log('✅ Bootstrap class loaded successfully');

    // Test manifest utilities
    const manifestUtils = require('../core/modules/manifest');
    console.log('✅ Manifest utilities loaded successfully');

    // Test database utilities
    const databaseUtils = require('../core/modules/database');
    console.log('✅ Database utilities loaded successfully');

    // Test token client
    const tokenClient = require('../core/modules/tokenClient');
    console.log('✅ Token client loaded successfully');

    console.log('✅ All core modules can be loaded');
    return true;
  } catch (error) {
    console.error('❌ Bootstrap integration test failed:', error.message);
    console.error('   This may indicate missing dependencies or path issues');
    return false;
  }
}

async function testElectronIntegration() {
  console.log('\n⚡ Testing Electron Integration');
  console.log('='.repeat(50));

  try {
    // Test main.js syntax and imports
    const mainPath = path.join(__dirname, 'main.js');
    if (!fs.existsSync(mainPath)) {
      console.log('❌ main.js not found');
      return false;
    }

    // Try to parse main.js (syntax check)
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    const mainModule = { exports: {} };

    // Mock Electron modules for testing
    const mockElectron = {
      app: { getPath: () => '/tmp/test', getVersion: () => '2.0.0' },
      BrowserWindow: class MockBrowserWindow {},
      ipcMain: { handle: () => {}, on: () => {} },
      dialog: { showErrorBox: () => {} },
      shell: { openExternal: () => {} }
    };

    // Mock Node modules
    const mockModules = {
      path: require('path'),
      fs: require('fs'),
      'sql.js': { Database: class {} },
      axios: { create: () => {} },
      yauzl: { open: () => {} }
    };

    // Simple syntax validation
    try {
      new Function('require', mainContent.replace('require(\'electron\'', 'require(\'mock-electron\''));
      console.log('✅ main.js syntax is valid');
    } catch (syntaxError) {
      console.log('❌ main.js has syntax errors:', syntaxError.message);
      return false;
    }

    // Test preload.js exists and has valid structure
    const preloadPath = path.join(__dirname, 'preload.js');
    if (fs.existsSync(preloadPath)) {
      console.log('✅ preload.js exists');
    } else {
      console.log('❌ preload.js not found');
      return false;
    }

    // Test renderer.js exists
    const rendererPath = path.join(__dirname, 'renderer.js');
    if (fs.existsSync(rendererPath)) {
      console.log('✅ renderer.js exists');
    } else {
      console.log('❌ renderer.js not found');
      return false;
    }

    // Test index.html exists
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html exists');
    } else {
      console.log('❌ index.html not found');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Electron integration test failed:', error.message);
    return false;
  }
}

async function runBootstrapTests() {
  console.log('🧪 OurLibrary Bootstrap System Tests');
  console.log('📅 Test Date:', new Date().toISOString());
  console.log('🔧 Test Environment:', process.env.NODE_ENV || 'development');

  const results = {
    fileSystem: false,
    database: false,
    manifest: false,
    integration: false,
    electron: false
  };

  // Run all tests
  results.fileSystem = await testFileSystemOperations();
  results.database = await testDatabaseIntegrity();
  results.manifest = await testManifestParsing();
  results.integration = await testBootstrapIntegration();
  results.electron = await testElectronIntegration();

  // Summary
  console.log('\n📊 Bootstrap Test Results Summary');
  console.log('='.repeat(50));

  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${passed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`);

  if (failed > 0) {
    console.log('\n❌ Some bootstrap tests failed.');
    console.log('   Check the output above for details on what needs to be fixed.');
  } else {
    console.log('\n✅ All bootstrap tests passed!');
    console.log('🎉 Bootstrap system is ready for integration with Electron app.');
    console.log('\n🚀 Ready to start the Electron app with:');
    console.log('   npm start');
  }

  return failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBootstrapTests().catch(console.error);
}

module.exports = {
  testFileSystemOperations,
  testDatabaseIntegrity,
  testManifestParsing,
  testBootstrapIntegration,
  testElectronIntegration,
  runBootstrapTests
};