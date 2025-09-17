const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3');
const { Bootstrap } = require('@ourlibrary/core');

let db;
let bootstrap;

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

ipcMain.handle('download-file', async (event, { bookId, fileName }) => {
  // TODO: Implement the new download flow using the token service.
  // 1. Get the distribution token from a secure store.
  // 2. Call the 'issueDownloadUrl' Firebase function via the tokenService module.
  // 3. The function will return a short-lived, signed Google Drive URL.
  // 4. Download the file from the signed URL using axios.
  // 5. Save the file to the downloads directory.
  // 6. Verify the file's checksum against the manifest.
  // 7. Open the file.

  console.log(`Request to download bookId: ${bookId}, fileName: ${fileName}`);
  dialog.showErrorBox('Not Implemented', 'The download functionality is not yet implemented in the new architecture.');
  return { success: false, error: 'Not Implemented' };
});
