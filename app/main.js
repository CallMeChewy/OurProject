const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Bootstrap = require('../core/bootstrap');
const { requestSignedUrl } = require('../core/modules/tokenClient');
const databaseUtils = require('../core/modules/database');
const manifestUtils = require('../core/modules/manifest');

let mainWindow;
let db;
let currentToken = null;
let bootstrap = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('index.html');
  mainWindow = win;
}

// Token management
async function validateToken(token) {
  try {
    if (!token) return { valid: false, error: 'Token is required' };

    // For now, we'll do basic validation. In production, we could test the token
    // with a minimal request to the token service or have a dedicated validation endpoint
    if (token.length < 10) {
      return { valid: false, error: 'Invalid token format' };
    }

    currentToken = token;

    // Store token securely for future use
    const userDataPath = app.getPath('userData');
    const tokenPath = path.join(userDataPath, 'token.json');
    await fs.promises.writeFile(tokenPath, JSON.stringify({
      token,
      lastUsed: new Date().toISOString()
    }));

    console.log('Token validated and stored:', token.substring(0, 8) + '...');
    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: error.message };
  }
}

async function loadStoredToken() {
  try {
    const userDataPath = app.getPath('userData');
    const tokenPath = path.join(userDataPath, 'token.json');

    if (fs.existsSync(tokenPath)) {
      const tokenData = JSON.parse(await fs.promises.readFile(tokenPath, 'utf8'));
      currentToken = tokenData.token;
      return tokenData.token;
    }
  } catch (error) {
    console.error('Error loading stored token:', error);
  }
  return null;
}

// Bootstrap initialization with token support
async function initializeBootstrap() {
  try {
    if (!bootstrap) {
      bootstrap = new Bootstrap({
        manifestUrl: process.env.OURLIBRARY_MANIFEST_URL || 'https://ourlibrary.github.io/manifest.json',
        appVersion: require('./package.json').version,
        sqlJsAssetRoots: [
          path.join(__dirname, 'Assets', 'sql.js'),
          path.join(process.resourcesPath, 'app.asar.unpacked', 'Assets', 'sql.js')
        ].filter(Boolean)
      });

      // Set up progress logging
      bootstrap.setLogCallback((message) => {
        console.log(`[Bootstrap] ${message}`);
        // Send progress to renderer if window exists
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bootstrap:log', message);
        }
      });

      bootstrap.setProgressCallback((step, completed, message) => {
        console.log(`[Bootstrap] ${step}: ${completed ? '✅' : '⏳'} ${message}`);
        // Send progress to renderer if window exists
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('bootstrap:progress', { step, completed, message });
        }
      });
    }

    // Initialize file system
    await bootstrap.initializeFileSystem();

    // Store token if we have one
    if (currentToken) {
      await bootstrap.setDistributionToken(currentToken);
    }

    return { success: true, appDir: bootstrap.getAppDirectory() };
  } catch (error) {
    console.error('Bootstrap initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Database initialization with bootstrap system
async function initializeAppDatabase() {
  try {
    if (!bootstrap) {
      const bootstrapResult = await initializeBootstrap();
      if (!bootstrapResult.success) {
        return bootstrapResult;
      }
    }

    const dbPath = bootstrap.getDatabasePath();

    // Check if database exists and is valid
    if (!fs.existsSync(dbPath)) {
      console.log('Database not found, attempting to download using token...');

      if (currentToken) {
        const downloadResult = await downloadDatabaseWithToken();
        if (!downloadResult.success) {
          return downloadResult;
        }
      } else {
        // Try to use offline bundle if available
        const offlineResult = await useOfflineDatabase();
        if (!offlineResult.success) {
          return offlineResult;
        }
      }
    }

    // Initialize database connection
    db = await databaseUtils.initializeDatabase(dbPath);

    // Check for updates in background
    checkForDatabaseUpdates();

    return {
      success: true,
      path: bootstrap.getAppDirectory(),
      version: await getDatabaseVersion()
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Download database using token service
async function downloadDatabaseWithToken() {
  try {
    console.log('Downloading database using token service...');

    if (!currentToken) {
      return { success: false, error: 'Token required for database download' };
    }

    // Get manifest from token service or fallback
    const manifest = await getDatabaseManifest();
    if (!manifest) {
      return { success: false, error: 'Failed to get database manifest' };
    }

    const archiveInfo = manifest.database_archive;
    if (!archiveInfo || !archiveInfo.fileId) {
      return { success: false, error: 'No database archive found in manifest' };
    }

    // Request signed URL from token service
    const downloadInfo = await requestSignedUrl({
      token: currentToken,
      fileId: archiveInfo.fileId,
      version: manifest.latest_version
    });

    // Download and extract database
    const dbPath = bootstrap.getDatabasePath();
    await downloadAndExtractDatabase(downloadInfo.url, dbPath, archiveInfo);

    return { success: true };
  } catch (error) {
    console.error('Database download error:', error);
    return { success: false, error: error.message };
  }
}

// Get database manifest
async function getDatabaseManifest() {
  try {
    // Try remote manifest first
    if (bootstrap.versionUrl) {
      try {
        return await manifestUtils.fetchRemoteManifest(bootstrap.versionUrl);
      } catch (remoteError) {
        console.log('Remote manifest failed, trying fallback:', remoteError.message);
      }
    }

    // Try fallback manifest
    const fallbackManifest = manifestUtils.loadFallbackManifest({
      explicitFallback: path.join(__dirname, 'config', 'manifest.local.json'),
      cwd: process.cwd(),
      dirname: __dirname,
      resourcesPath: process.resourcesPath,
      log: console.log
    });

    return fallbackManifest;
  } catch (error) {
    console.error('Manifest retrieval error:', error);
    return null;
  }
}

// Download and extract database from URL
async function downloadAndExtractDatabase(url, dbPath, archiveInfo) {
  const axios = require('axios');
  const yauzl = require('yauzl');

  // Download to temporary file
  const tempPath = path.join(require('os').tmpdir(), `ourlibrary-db-${Date.now()}.zip`);

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });

    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Extract database from zip
    await new Promise((resolve, reject) => {
      yauzl.open(tempPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);

        zipfile.on('entry', (entry) => {
          const isDb = /\.db$/i.test(entry.fileName);
          if (!isDb) {
            zipfile.readEntry();
            return;
          }

          zipfile.openReadStream(entry, (streamErr, readStream) => {
            if (streamErr) return reject(streamErr);

            const writeStream = fs.createWriteStream(dbPath);
            readStream.pipe(writeStream);

            writeStream.on('finish', () => {
              zipfile.close();
              resolve();
            });

            writeStream.on('error', reject);
          });
        });

        zipfile.on('end', () => {
          reject(new Error('No database file found in archive'));
        });

        zipfile.on('error', reject);
        zipfile.readEntry();
      });
    });

    console.log('Database downloaded and extracted successfully');
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

// Try to use offline database bundle
async function useOfflineDatabase() {
  try {
    console.log('Attempting to use offline database bundle...');

    const offlineDbPaths = [
      path.join(__dirname, 'Assets', 'OurLibrary.db'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'Assets', 'OurLibrary.db')
    ].filter(Boolean);

    for (const offlinePath of offlineDbPaths) {
      if (fs.existsSync(offlinePath)) {
        const dbPath = bootstrap.getDatabasePath();
        fs.copyFileSync(offlinePath, dbPath);
        console.log('Using offline database from:', offlinePath);
        return { success: true };
      }
    }

    return { success: false, error: 'No offline database available' };
  } catch (error) {
    console.error('Offline database error:', error);
    return { success: false, error: error.message };
  }
}

// Get current database version
async function getDatabaseVersion() {
  try {
    const dbPath = bootstrap.getDatabasePath();
    const versionInfo = await databaseUtils.getLocalDatabaseVersion({
      databasePath: dbPath,
      resolveSqlJsAsset: bootstrap.resolveSqlJsAsset.bind(bootstrap),
      log: console.log
    });
    return versionInfo.version;
  } catch (error) {
    console.error('Error getting database version:', error);
    return 'unknown';
  }
}

// Check for database updates in background
async function checkForDatabaseUpdates() {
  try {
    if (!currentToken) return;

    const currentVersion = await getDatabaseVersion();
    const manifest = await getDatabaseManifest();

    if (!manifest || !manifest.latest_version) return;

    // Compare versions (simple string comparison for now)
    if (currentVersion !== manifest.latest_version) {
      console.log(`Database update available: ${currentVersion} → ${manifest.latest_version}`);

      // Notify renderer about available update
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('database:update-available', {
          currentVersion,
          availableVersion: manifest.latest_version,
          manifest
        });
      }
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// IPC handlers for token service
ipcMain.handle('token:validate', async (event, token) => {
  return await validateToken(token);
});

ipcMain.handle('token:load', async () => {
  return await loadStoredToken();
});

ipcMain.handle('token:clear', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const tokenPath = path.join(userDataPath, 'token.json');
    if (fs.existsSync(tokenPath)) {
      await fs.promises.unlink(tokenPath);
    }
    currentToken = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC handlers for database operations
ipcMain.handle('db:initialize', async () => {
  return await initializeAppDatabase();
});

ipcMain.handle('db:searchBooks', async (event, query) => {
  if (!db) return { error: 'Database not initialized' };

  try {
    const searchQuery = `%${query}%`;
    const stmt = db.prepare(`
      SELECT * FROM Books
      WHERE Title LIKE ? OR Author LIKE ?
      ORDER BY Title
      LIMIT 50
    `);
    const results = stmt.all(searchQuery, searchQuery);
    return { success: true, data: results };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('db:getBooksByCategory', async (event, categoryId) => {
  if (!db) return { error: 'Database not initialized' };

  try {
    const stmt = db.prepare(`
      SELECT * FROM Books
      WHERE Category_ID = ?
      ORDER BY Title
    `);
    const results = stmt.all(categoryId);
    return { success: true, data: results };
  } catch (error) {
    return { error: error.message };
  }
});

// IPC handlers for bootstrap operations
ipcMain.handle('bootstrap:getStatus', async () => {
  if (!bootstrap) {
    return { initialized: false, status: 'Bootstrap not initialized' };
  }

  return {
    initialized: true,
    appDir: bootstrap.getAppDirectory(),
    hasToken: !!currentToken,
    progress: bootstrap.setupProgress
  };
});

ipcMain.handle('bootstrap:downloadDatabase', async () => {
  if (!currentToken) {
    return { success: false, error: 'Token required for database download' };
  }

  try {
    const result = await downloadDatabaseWithToken();
    if (result.success) {
      // Reinitialize database with new download
      db = await databaseUtils.initializeDatabase(bootstrap.getDatabasePath());
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bootstrap:checkForUpdates', async () => {
  await checkForDatabaseUpdates();
  return { success: true };
});

ipcMain.handle('bootstrap:getVersion', async () => {
  return await getDatabaseVersion();
});

// IPC handlers for downloads with token service
ipcMain.handle('download:book', async (event, bookData) => {
  if (!currentToken) {
    return { success: false, error: 'Valid token required for downloads' };
  }

  try {
    const { fileId, version, title } = bookData;

    // Create a mock download for demonstration
    // In production, this would use the actual token service
    console.log('Requesting download with token:', currentToken.substring(0, 8) + '...');
    console.log('File details:', { fileId, version, title });

    // Simulate token service call
    // const downloadInfo = await requestSignedUrl({
    //   token: currentToken,
    //   fileId,
    //   version
    // });

    // For demo purposes, create a mock download file
    const userDataPath = app.getPath('userData');
    const downloadsPath = path.join(userDataPath, 'Downloads');

    // Ensure downloads directory exists
    if (!fs.existsSync(downloadsPath)) {
      await fs.promises.mkdir(downloadsPath, { recursive: true });
    }

    const mockFileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_demo.txt`;
    const mockFilePath = path.join(downloadsPath, mockFileName);

    // Create a mock file
    const mockContent = `OurLibrary Demo Download\n\nTitle: ${title}\nFile ID: ${fileId}\nVersion: ${version}\nToken: ${currentToken.substring(0, 8)}...\n\nThis is a demonstration of the token-protected download system.\nIn production, this would be the actual book file.\n\nDownloaded: ${new Date().toISOString()}`;

    await fs.promises.writeFile(mockFilePath, mockContent);

    return {
      success: true,
      message: `Downloaded: ${mockFileName}`,
      filePath: mockFilePath,
      // In production: downloadUrl: downloadInfo.url
    };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(async () => {
  createWindow();

  // Try to load stored token on startup
  const storedToken = await loadStoredToken();
  if (storedToken) {
    console.log('Found stored token, will attempt to use it');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});