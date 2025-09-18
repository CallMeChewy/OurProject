#!/usr/bin/env node

const { hideBin } = require('yargs/helpers');
const yargs = require('yargs/yargs');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const { execFile } = require('child_process');

const execFileAsync = promisify(execFile);

function parseAssetSpecs(specs = []) {
  return specs.map((spec) => {
    const [srcRaw, destRaw] = spec.split(':');
    if (!srcRaw) {
      throw new Error(`Invalid asset specification: ${spec}`);
    }
    const src = path.resolve(srcRaw);
    const dest = destRaw ? destRaw.replace(/^\/+/, '') : path.basename(src);
    if (!dest) {
      throw new Error(`Asset destination resolved to empty string for spec: ${spec}`);
    }
    return { src, dest };
  });
}

async function ensureFileExists(filePath, label) {
  try {
    const stats = await fsp.stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`${label} at ${filePath} is not a regular file`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`${label} not found at ${filePath}`);
    }
    throw error;
  }
}

async function copyInto(tempDir, entry) {
  const destination = path.join(tempDir, entry.dest);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await fsp.copyFile(entry.src, destination);
}

async function createZipArchive({ databaseEntry, assetEntries, outputPath }) {
  await fsp.mkdir(path.dirname(outputPath), { recursive: true });

  const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'ourlibrary-release-'));

  try {
    await copyInto(tempRoot, databaseEntry);
    for (const asset of assetEntries) {
      await copyInto(tempRoot, asset);
    }

    const pythonScript = "import os, sys, zipfile\nzip_path = sys.argv[1]\nroot = sys.argv[2]\nwith zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as zf:\n    for folder, _, files in os.walk(root):\n        for name in files:\n            full = os.path.join(folder, name)\n            rel = os.path.relpath(full, root)\n            zf.write(full, rel)\n";
    await execFileAsync('python3', ['-c', pythonScript, outputPath, tempRoot]);
  } catch (error) {
    throw new Error(`Failed to create archive: ${error.message}`);
  } finally {
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

async function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function updateManifest({ manifestPath, version, minVersion, archiveInfo, releaseNotes }) {
  const raw = await fsp.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);

  manifest.latest_version = version;
  if (minVersion) {
    manifest.minimum_required_version = minVersion;
  }

  const previousArchive = manifest.database_archive || {};
  manifest.database_archive = {
    file_id: previousArchive.file_id ?? null,
    download_url: null,
    sha256: archiveInfo.sha256,
    size_bytes: archiveInfo.sizeBytes,
    fileName: archiveInfo.fileName,
    inner_path: archiveInfo.innerPath,
    tier: archiveInfo.tier,
  };

  if (typeof releaseNotes === 'string') {
    manifest.release_notes = releaseNotes.trim();
  }

  await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

async function writeMetadataFile(metadataPath, metadata) {
  await fsp.mkdir(path.dirname(metadataPath), { recursive: true });
  await fsp.writeFile(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('package-release')
    .version(false)
    .option('database', {
      type: 'string',
      demandOption: true,
      describe: 'Path to the SQLite database to package',
    })
    .option('version', {
      type: 'string',
      demandOption: true,
      describe: 'Semantic version for this release (e.g., 2025.03.01)',
    })
    .option('inner-path', {
      type: 'string',
      default: 'OurLibrary.db',
      describe: 'Path to store the database within the zip archive',
    })
    .option('output', {
      type: 'string',
      describe: 'Folder to place the generated archive and metadata',
    })
    .option('manifest', {
      type: 'string',
      default: path.resolve(process.cwd(), 'config', 'manifest.local.json'),
      describe: 'Manifest file to update after packaging',
    })
    .option('min-version', {
      type: 'string',
      describe: 'Optional minimum required version to set in manifest',
    })
    .option('tier', {
      type: 'string',
      default: 'free',
      describe: 'Entitlement tier for this archive (e.g., free, premium)',
    })
    .option('asset', {
      type: 'array',
      describe: 'Additional files to include in the archive (format: src[:dest])',
    })
    .option('notes', {
      type: 'string',
      describe: 'Release notes text to embed in manifest and metadata',
    })
    .option('notes-file', {
      type: 'string',
      describe: 'Path to a file containing release notes',
    })
    .option('metadata-out', {
      type: 'string',
      describe: 'Path to write release metadata JSON',
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      describe: 'Plan the packaging steps without writing files',
    })
    .option('force', {
      type: 'boolean',
      default: false,
      describe: 'Overwrite existing archive/metadata files',
    })
    .option('skip-manifest', {
      type: 'boolean',
      default: false,
      describe: 'Skip manifest updates even if packaging is performed',
    })
    .help()
    .strict()
    .argv;

  const version = argv.version.trim();
  const databasePath = path.resolve(argv.database);
  const innerPath = argv.innerPath.replace(/^\/+/, '') || 'OurLibrary.db';
  const outputDir = path.resolve(argv.output || path.join(process.cwd(), 'dist', 'releases', version));
  const manifestPath = path.resolve(argv.manifest);
  const assets = parseAssetSpecs(argv.asset);
  const metadataPath = path.resolve(
    argv.metadataOut || path.join(outputDir, 'release-metadata.json'),
  );

  const releaseNotes = argv.notesFile
    ? await fsp.readFile(path.resolve(argv.notesFile), 'utf8')
    : (argv.notes || '');

  const zipFileName = `OurLibrary-db-${version}.zip`;
  const zipPath = path.join(outputDir, zipFileName);

  if (!argv.dryRun) {
    await ensureFileExists(databasePath, 'Database');
    for (const asset of assets) {
      await ensureFileExists(asset.src, `Asset ${asset.src}`);
    }
    await ensureFileExists(manifestPath, 'Manifest');

    if (!argv.force) {
      if (fs.existsSync(zipPath)) {
        throw new Error(`Archive already exists at ${zipPath}. Use --force to overwrite.`);
      }
      if (fs.existsSync(metadataPath)) {
        throw new Error(`Metadata file already exists at ${metadataPath}. Use --force to overwrite.`);
      }
    }

    const databaseEntry = { src: databasePath, dest: innerPath };
    await createZipArchive({
      databaseEntry,
      assetEntries: assets,
      outputPath: zipPath,
    });

    const sizeBytes = (await fsp.stat(zipPath)).size;
    const hash = await sha256(zipPath);

    const metadata = {
      version,
      generatedAt: new Date().toISOString(),
      sourceDatabase: databasePath,
      archive: {
        fileName: zipFileName,
        innerPath,
        sha256: hash,
        sizeBytes,
        tier: argv.tier,
      },
      assets: assets.map((asset) => ({
        source: asset.src,
        destination: asset.dest,
      })),
      notes: releaseNotes.trim(),
    };

    await writeMetadataFile(metadataPath, metadata);

    if (!argv.skipManifest) {
      await updateManifest({
        manifestPath,
        version,
        minVersion: argv.minVersion,
        archiveInfo: {
          fileName: zipFileName,
          innerPath,
          sha256: hash,
          sizeBytes,
          tier: argv.tier,
        },
        releaseNotes,
      });
    }

    console.log('Release archive created:', zipPath);
    console.log('Archive size (bytes):', sizeBytes);
    console.log('Archive SHA-256:', hash);
    console.log('Metadata written to:', metadataPath);
    if (!argv.skipManifest) {
      console.log('Manifest updated:', manifestPath);
    }

    console.log('\nNext steps:');
    console.log('- Upload the zip archive to Drive and record the generated file ID.');
    console.log('- Update Firestore `archives/{version}` with the file ID, size, sha256, and tier.');
    console.log('- Once uploaded, set `database_archive.file_id` in the manifest or via deployment automation.');
  } else {
    console.log('[dry-run] Would package database from:', databasePath);
    console.log('[dry-run] Archive would be written to:', zipPath);
    console.log('[dry-run] Manifest would be updated at:', manifestPath);
    if (assets.length) {
      console.log('[dry-run] Additional assets:');
      assets.forEach((asset) => console.log(` - ${asset.src} -> ${asset.dest}`));
    }
  }
}

main().catch((error) => {
  console.error('Release packaging failed:', error.message);
  process.exitCode = 1;
});
