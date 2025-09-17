const fs = require('fs');
const path = require('path');
const axios = require('axios');

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest response was empty or invalid');
  }

  const requiredFields = ['latest_version', 'minimum_required_version', 'database_archive'];
  for (const field of requiredFields) {
    if (manifest[field] === undefined || manifest[field] === null) {
      throw new Error(`Manifest missing required field: ${field}`);
    }
  }

  return manifest;
}

async function fetchRemoteManifest(url) {
  const response = await axios.get(url);
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}: Failed to fetch manifest`);
  }
  return validateManifest(response.data);
}

function candidateFallbackPaths({ explicitFallback, cwd, dirname, resourcesPath }) {
  const paths = [explicitFallback];

  if (resourcesPath) {
    paths.push(
      path.join(resourcesPath, 'config', 'manifest.local.json'),
      path.join(resourcesPath, 'app.asar.unpacked', 'config', 'manifest.local.json')
    );
  }

  paths.push(
    path.join(cwd, 'config', 'manifest.local.json'),
    path.join(dirname, '..', 'config', 'manifest.local.json')
  );

  return paths.filter(Boolean);
}

function loadFallbackManifest(options) {
  const { log, sourceError } = options;

  for (const candidate of candidateFallbackPaths(options)) {
    try {
      if (!fs.existsSync(candidate)) {
        continue;
      }
      const data = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      const manifest = validateManifest(data);
      manifest.__fromFallback = true;
      if (log) {
        log(`Using fallback manifest at: ${candidate}`);
        if (sourceError) {
          log(`Reason for fallback: ${sourceError.message}`);
        }
      }
      return manifest;
    } catch (fallbackError) {
      if (log) log(`Failed to load fallback manifest from ${candidate}: ${fallbackError.message}`);
    }
  }

  return null;
}

module.exports = {
  validateManifest,
  fetchRemoteManifest,
  loadFallbackManifest,
};
