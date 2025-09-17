const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const Bootstrap = require('../bootstrap');
const initSqlJs = require('sql.js');

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

test('getLocalDatabaseVersion reads version metadata from sqlite db', async (t) => {
  const tempAppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));
  try {
    const dbDir = path.join(tempAppDir, 'database');
    fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, 'OurLibrary.db');

    const SQL = await initSqlJs({
      locateFile: (filename) => path.join(process.cwd(), 'app', 'Assets', 'sql.js', filename)
    });
    const db = new SQL.Database();
    db.run(`CREATE TABLE IF NOT EXISTS DatabaseMetadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`INSERT OR REPLACE INTO DatabaseMetadata (key, value, updated_at) VALUES ('version', ?, datetime('now'))`, ['2.3.4']);
    const data = db.export();
    fs.writeFileSync(dbPath, data);
    db.close();

    const bootstrap = new Bootstrap({ sqlJsAssetRoots: [path.join(process.cwd(), 'app', 'Assets', 'sql.js')] });
    bootstrap.appDir = tempAppDir;
    bootstrap.config = { database_path: './database/OurLibrary.db' };

    const result = await bootstrap.getLocalDatabaseVersion();
    assert.strictEqual(result.version, '2.3.4');
    assert.strictEqual(result.exists, true);
  } finally {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
});

test('compareVersions handles different length inputs', (t) => {
  const bootstrap = new Bootstrap();
  assert.strictEqual(bootstrap.compareVersions('1.2.3', '1.2.3'), 0);
  assert.strictEqual(bootstrap.compareVersions('1.2.3', '1.2.4'), -1);
  assert.strictEqual(bootstrap.compareVersions('1.2.3', '1.2.3.1'), -1);
  assert.strictEqual(bootstrap.compareVersions('1.2.3', '1.2'), 1);
  assert.strictEqual(bootstrap.compareVersions('2.0.0', '1.9.9'), 1);
  assert.strictEqual(bootstrap.compareVersions('1.10.0', '1.2.0'), 1);
});

test('checkForUpdates surfaces manifest version deltas', async (t) => {
  const bootstrap = new Bootstrap();
  bootstrap.appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));

  // stub getRemoteManifest / getLocalDatabaseVersion
  const remote = {
    latest_version: '2.0.0',
    minimum_required_version: '1.5.0',
    database_archive: {
      file_id: 'stub',
      download_url: null
    }
  };

  bootstrap.getRemoteManifest = async () => remote;
  bootstrap.getLocalDatabaseVersion = async () => ({ version: '1.0.0', exists: true });

  const updateCheck = await bootstrap.checkForUpdates();
  assert.strictEqual(updateCheck.status, 'mandatory');
  assert.strictEqual(updateCheck.needsUpdate, true);
  assert.strictEqual(updateCheck.remote.latest_version, '2.0.0');
});

test('resolveConfigPath and getters provide absolute paths', async (t) => {
  const tempAppDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourlibrary-appdir-'));
  try {
    const bootstrap = new Bootstrap();
    bootstrap.appDir = tempAppDir;
    bootstrap.config = {
      database_path: './database/OurLibrary.db',
      downloads_dir: './downloads',
      cache_dir: './cache'
    };

    const dbPath = bootstrap.getDatabasePath();
    const downloadsDir = bootstrap.getDownloadsDir();
    const cacheDir = bootstrap.getCacheDir();

    assert.ok(path.isAbsolute(dbPath));
    assert.ok(path.isAbsolute(downloadsDir));
    assert.ok(path.isAbsolute(cacheDir));
    assert.match(dbPath, new RegExp(`${path.sep}database${path.sep}OurLibrary\.db$`));
    assert.match(downloadsDir, new RegExp(`${path.sep}downloads$`));
    assert.match(cacheDir, new RegExp(`${path.sep}cache$`));
  } finally {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
});
