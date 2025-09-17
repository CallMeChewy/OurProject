const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const Bootstrap = require('../bootstrap');

test('loadLocalManifestFallback picks up packaged manifest', async (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-test-'));
  const resourcesDir = path.join(tempRoot, 'resources');
  const manifestDir = path.join(resourcesDir, 'config');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifestPath = path.join(manifestDir, 'manifest.local.json');
  const manifest = {
    latest_version: '1.2.3',
    minimum_required_version: '1.0.0',
    database_archive: {
      file_id: 'local-dev-db',
      download_url: null,
      sha256: null,
      size_bytes: 0
    }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const originalResourcesPath = process.resourcesPath;
  const originalFallback = process.env.OURLIBRARY_MANIFEST_FALLBACK;
  try {
    process.resourcesPath = resourcesDir;
    delete process.env.OURLIBRARY_MANIFEST_FALLBACK;

    const bootstrap = new Bootstrap();
    const result = bootstrap.loadLocalManifestFallback(new Error('network unavailable'));

    assert.ok(result, 'expected manifest to load');
    assert.strictEqual(result.latest_version, '1.2.3');
    assert.strictEqual(result.__fromFallback, true);
  } finally {
    if (originalResourcesPath === undefined) {
      delete process.resourcesPath;
    } else {
      process.resourcesPath = originalResourcesPath;
    }
    if (originalFallback === undefined) {
      delete process.env.OURLIBRARY_MANIFEST_FALLBACK;
    } else {
      process.env.OURLIBRARY_MANIFEST_FALLBACK = originalFallback;
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('ensureDatabasePlaceholder creates sqlite file when missing', async (t) => {
  const tempAppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));
  try {
    const bootstrap = new Bootstrap();
    bootstrap.appDir = tempAppDir;
    bootstrap.config = {
      database_path: './database/OurLibrary.db'
    };

    await bootstrap.ensureDatabasePlaceholder();

    const expectedPath = path.join(tempAppDir, './database/OurLibrary.db');
    assert.ok(fs.existsSync(expectedPath), 'placeholder database should exist');
  } finally {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
});
