const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { packageRelease } = require('../package-release');

function mkdtemp(prefix = 'ourlibrary-release-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('packageRelease packages database and updates manifest', async () => {
  const workDir = mkdtemp();

  const dbPath = path.join(workDir, 'OurLibrary.db');
  fs.writeFileSync(dbPath, 'fake-db-content');

  const manifestPath = path.join(workDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    latest_version: '0.0.0',
    minimum_required_version: '0.0.0',
    database_archive: {
      file_id: 'existing-file-id',
      download_url: null,
      sha256: '',
      size_bytes: 0,
    }
  }, null, 2));

  const outputDir = path.join(workDir, 'dist');

  const result = await packageRelease({
    database: dbPath,
    version: '1.2.3',
    output: outputDir,
    manifest: manifestPath,
    notes: 'Automated test release',
    tier: 'free',
    metadataOut: path.join(outputDir, 'metadata.json'),
  });

  assert.ok(fs.existsSync(result.zipPath), 'zip archive should exist');
  assert.ok(result.sha256, 'sha256 should be computed');
  assert.strictEqual(result.version, '1.2.3');
  assert.ok(fs.existsSync(result.metadataPath), 'metadata file should exist');

  const metadata = JSON.parse(fs.readFileSync(result.metadataPath, 'utf8'));
  assert.strictEqual(metadata.version, '1.2.3');
  assert.strictEqual(metadata.archive.innerPath, 'OurLibrary.db');
  assert.strictEqual(metadata.notes, 'Automated test release');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.latest_version, '1.2.3');
  assert.strictEqual(manifest.database_archive.sha256, result.sha256);
  assert.strictEqual(manifest.database_archive.inner_path, 'OurLibrary.db');

  fs.rmSync(workDir, { recursive: true, force: true });
});

test('packageRelease dry-run reports actions only', async () => {
  const workDir = mkdtemp();
  const dbPath = path.join(workDir, 'OurLibrary.db');
  fs.writeFileSync(dbPath, 'placeholder');

  const result = await packageRelease({
    database: dbPath,
    version: '9.9.9',
    dryRun: true,
  });

  assert.strictEqual(result.dryRun, true);
  assert.ok(result.zipPath.endsWith('OurLibrary-db-9.9.9.zip'));
  assert.ok(!fs.existsSync(result.zipPath), 'zip should not exist in dry run');

  fs.rmSync(workDir, { recursive: true, force: true });
});
