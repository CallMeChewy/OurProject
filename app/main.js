const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');
const axios = require('axios');
const sqlite3 = require('sqlite3');
const { Bootstrap, TokenService } = require('@ourlibrary/core');

let db;
let bootstrap;
let tokenService;

const DRIVE_ID_FIELDS = ['GoogleDriveID', 'google_drive_id', 'GoogleDriveId', 'googleDriveId', 'file_id', 'FileId', 'fileId', 'DriveId', 'drive_id'];
const VERSION_FIELDS = ['ArchiveVersion', 'archive_version', 'Version', 'version', 'ManifestVersion', 'manifest_version'];

const WHITESPACE_SEQUENCE = /\s+/g;
const INVALID_PATH_CHARS = /[\/:*?"<>|\n\r\t\0\f\v]/g;

function resolveTokenEndpoint() {
  return process.env.OURLIBRARY_TOKEN_ENDPOINT
    || process.env.OURLIBRARY_TOKEN_HTTP_ENDPOINT
    || null;
}

function configureTokenService() {
  const endpoint = resolveTokenEndpoint();
  const resolvedToken = bootstrap ? bootstrap.getDistributionToken() : process.env.OURLIBRARY_TOKEN || null;

  if (!tokenService) {
    tokenService = new TokenService({ endpoint, token: resolvedToken });
    return;
  }

  tokenService.setEndpoint(endpoint || null);
  tokenService.setDefaultToken(resolvedToken);
  tokenService.clearCache();
}

function cleanSegment(value) {
  const str = value == null ? '' : String(value);
  return str
    .replace(WHITESPACE_SEQUENCE, ' ')
    .replace(INVALID_PATH_CHARS, '')
    .trim();
}

function sanitizeFileName(name, fallbackBase = 'download') {
  const fallback = cleanSegment(`${fallbackBase}` || 'download') || 'download';

  if (!name) {
    return `${fallback}.pdf`;
  }

  const candidate = cleanSegment(name.toString());
  return candidate || `${fallback}.pdf`;
}

function extractField(record, candidates) {
  if (!record) return null;
  for (const field of candidates) {
    if (record[field] !== undefined && record[field] !== null && String(record[field]).trim()) {
      return String(record[field]).trim();
    }
  }
  return null;
}

function determineVersion(record) {
  const fromRecord = extractField(record, VERSION_FIELDS);
  if (fromRecord) {
    return fromRecord;
  }
  return bootstrap ? bootstrap.getAppVersion() : null;
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getBookById(bookId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Books WHERE ID = ?', [bookId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

async function downloadToFile(url, destination) {
  const response = await axios({
    method: 'get',
    url,
    responseType: 'stream',
  });

  if (response.status !== 200) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  const writer = fs.createWriteStream(destination);
  await pipeline(response.data, writer);
}


if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('new-desktop-library.html');
}

app.whenReady().then(async () => {
  bootstrap = new Bootstrap({ appVersion: app.getVersion() });
  bootstrap.setLogCallback((msg) => console.log(msg));
  bootstrap.setProgressCallback((step, completed, message) => {
    // Optional: Send progress to renderer process
    // win.webContents.send('installation-progress', { step, completed, message });
    console.log(`Installation Progress: ${step} - ${message}`);
  });

  const installResult = await bootstrap.performFullInstallation();

  if (!installResult.success) {
    dialog.showErrorBox('Installation Failed', installResult.message || 'An unknown error occurred during installation.');
    app.quit();
    return;
  }

  configureTokenService();

  const dbPath = bootstrap.getDatabasePath();

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
      dialog.showErrorBox('Database Error', 'Could not open the OurLibrary database.');
      app.quit();
    } else {
      console.log('Connected to the OurLibrary database.');
      createWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) db.close();
    app.quit();
  }
});

// --- Database IPC Handlers ---

ipcMain.handle('db:initialize', async () => {
  // This is now handled by the bootstrap process on app.whenReady
  const status = bootstrap.getInstallationStatus();
  return { ok: status.readyToLaunch, mode: 'desktop', message: status.message };
});

ipcMain.handle('db:connect', async () => {
  const status = bootstrap.getInstallationStatus();
  return { ok: status.readyToLaunch, mode: 'desktop', message: status.message };
});

ipcMain.handle('db:getStatus', async () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return resolve({ ok: false, mode: 'desktop', books: 0, message: 'Database not connected' });
    }
    db.get('SELECT COUNT(*) AS n FROM Books', (err, row) => {
      if (err) {
        console.error(err);
        resolve({ ok: true, mode: 'desktop', books: 0, message: err.message });
      } else {
        resolve({ ok: true, mode: 'desktop', books: row.n, message: 'Connected' });
      }
    });
  });
});

ipcMain.handle('db:query', async (event, sql, params) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      return reject(new Error('Database not connected'));
    }
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

// --- File System IPC Handlers ---

ipcMain.handle('file:openExternal', async (event, filePath) => {
    try {
        await shell.openExternal(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// --- Download IPC Handler (New Architecture) ---

ipcMain.handle('download-file', async (event, { bookId, fileName, forceRefresh } = {}) => {
  try {
    if (!db) {
      throw new Error('Database not connected');
    }
    if (!bookId) {
      throw new Error('bookId is required to download a file.');
    }

    const book = await getBookById(bookId);
    if (!book) {
      throw new Error('Book not found in the local catalog.');
    }

    const fileId = extractField(book, DRIVE_ID_FIELDS);
    if (!fileId) {
      throw new Error('This book does not have an associated Google Drive file ID.');
    }

    const version = determineVersion(book);
    if (!version) {
      throw new Error('Unable to determine archive version for the download request.');
    }

    if (!tokenService) {
      configureTokenService();
    }
    if (!tokenService) {
      throw new Error('Token service is not configured. Please set a distribution token.');
    }

    const signed = await tokenService.requestSignedUrl({
      fileId,
      version,
      forceRefresh: Boolean(forceRefresh),
    });

    const downloadsDir = bootstrap.getDownloadsDir();
    ensureDirectoryExists(downloadsDir);

    const targetName = sanitizeFileName(fileName || `${fileId}.pdf`, fileId);
    const targetPath = path.join(downloadsDir, targetName);

    try {
      await downloadToFile(signed.url, targetPath);
    } catch (downloadError) {
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      throw downloadError;
    }

    const openResult = await shell.openPath(targetPath);
    if (openResult) {
      console.warn('Unable to auto-open downloaded file:', openResult);
    }

    return {
      success: true,
      path: targetPath,
      quotaRemaining: signed.quotaRemaining ?? null,
      quotaLimit: signed.quotaLimit ?? null,
      archive: signed.archive || null,
    };
  } catch (error) {
    console.error('Download failed:', error);
    dialog.showErrorBox('Download Failed', error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('token:get', async () => {
  try {
    return { success: true, token: bootstrap.getDistributionToken() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('token:set', async (event, token) => {
  try {
    await bootstrap.setDistributionToken(token || null);
    configureTokenService();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
