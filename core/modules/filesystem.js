const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_DIRECTORIES = ['cache', 'database', 'downloads', 'user_data', 'logs'];

function ensureDirectory(dirPath, log) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    if (log) log(`Created directory: ${path.basename(dirPath)}`);
  } else if (log) {
    log(`Directory exists: ${path.basename(dirPath)}`);
  }
}

function applyConfigDefaults(config, { appVersion, appDir }) {
  const normalized = { ...config };
  let updated = false;

  const defaults = {
    app_name: 'OurLibrary',
    version: appVersion,
    database_path: './database/OurLibrary.db',
    cache_dir: './cache',
    downloads_dir: './downloads',
    installation_complete: false,
    app_directory: appDir
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (normalized[key] === undefined || normalized[key] === null) {
      normalized[key] = value;
      updated = true;
    }
  }

  if (!normalized.installation_date) {
    normalized.installation_date = new Date().toISOString();
    updated = true;
  }

  if (!normalized.user_preferences) {
    normalized.user_preferences = {
      theme: 'light',
      language: 'en'
    };
    updated = true;
  }

  return { normalized, updated };
}

function loadConfig(appDir, { appVersion, log } = {}) {
  const configPath = path.join(appDir, 'user_data', 'config.json');
  let config;

  if (!fs.existsSync(configPath)) {
    config = {
      app_name: 'OurLibrary',
      version: appVersion,
      database_path: './database/OurLibrary.db',
      cache_dir: './cache',
      downloads_dir: './downloads',
      installation_date: new Date().toISOString(),
      user_preferences: {
        theme: 'light',
        language: 'en'
      },
      installation_complete: false,
      app_directory: appDir
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    if (log) log(`Created initial config: ${configPath}`);
  } else {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const { normalized, updated } = applyConfigDefaults(config, { appVersion, appDir });
  if (updated) {
    fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2));
    if (log) log(`Updated config with default values: ${configPath}`);
  }

  return { config: normalized, configPath };
}

function resolveConfigPath(appDir, relativePath) {
  if (!appDir) {
    throw new Error('Application directory not set');
  }

  if (!relativePath) {
    return appDir;
  }

  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }

  const trimmed = relativePath.replace(/^\.?\//, '');
  return path.join(appDir, trimmed);
}

function prepareFileSystem({ log, getAppVersion, directories = DEFAULT_DIRECTORIES }) {
  const homeDir = os.homedir();
  const appDir = path.join(homeDir, 'OurLibrary');
  if (log) log(`Target app directory: ${appDir}`);

  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
    if (log) log(`Created app directory: ${appDir}`);
  } else if (log) {
    log(`App directory already exists: ${appDir}`);
  }

  directories.forEach((dir) => {
    const fullPath = path.join(appDir, dir);
    ensureDirectory(fullPath, log);
  });

  const { config } = loadConfig(appDir, { appVersion: getAppVersion(), log });
  return { appDir, config };
}

module.exports = {
  prepareFileSystem,
  loadConfig,
  resolveConfigPath,
};
