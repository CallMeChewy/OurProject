const fs = require('fs');
const path = require('path');
const os = require('os');
const initSqlJs = require('sql.js');

async function getLocalDatabaseVersion({ databasePath, resolveSqlJsAsset, log }) {
  try {
    if (!fs.existsSync(databasePath)) {
      return { version: '0.0.0', exists: false };
    }

    const SQL = await initSqlJs({ locateFile: resolveSqlJsAsset });
    const fileBuffer = fs.readFileSync(databasePath);
    const db = new SQL.Database(fileBuffer);

    try {
      const stmt = db.prepare("SELECT value FROM DatabaseMetadata WHERE key = 'version'");
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        db.close();
        return { version: row.value || '0.0.0', exists: true };
      } else {
        stmt.free();
        db.close();
        return { version: '0.0.0', exists: true };
      }
    } catch (err) {
      log && log('No version found in database metadata, assuming 0.0.0');
      db.close();
      return { version: '0.0.0', exists: true };
    }
  } catch (error) {
    log && log(`Error opening database for version check: ${error.message}`);
    return { version: '0.0.0', exists: false };
  }
}

async function verifyDatabase({ databasePath, resolveSqlJsAsset }) {
  const SQL = await initSqlJs({ locateFile: resolveSqlJsAsset });
  if (!fs.existsSync(databasePath)) {
    throw new Error('Database file does not exist');
  }

  const fileBuffer = fs.readFileSync(databasePath);
  const db = new SQL.Database(fileBuffer);

  try {
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Books'");
    const hasTable = stmt.step();
    stmt.free();
    db.close();

    if (!hasTable) {
      throw new Error('Database missing required Books table');
    }

    return true;
  } catch (err) {
    db.close();
    throw new Error(`Database validation failed: ${err.message}`);
  }
}

function createBackup({ databasePath, log }) {
  if (!fs.existsSync(databasePath)) {
    return;
  }
  const backupDir = path.join(path.dirname(databasePath), 'Backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `OurLibrary_backup_${timestamp}.db`);
  fs.copyFileSync(databasePath, backupPath);
  log && log(`Database backed up to: ${backupPath}`);
}

async function updateDatabaseVersion({ databasePath, resolveSqlJsAsset, log, newVersion }) {
  try {
    const SQL = await initSqlJs({ locateFile: resolveSqlJsAsset });
    let sqlDb;
    if (fs.existsSync(databasePath)) {
      const fileBuffer = fs.readFileSync(databasePath);
      sqlDb = new SQL.Database(fileBuffer);
    } else {
      sqlDb = new SQL.Database();
    }

    try {
      sqlDb.run(`CREATE TABLE IF NOT EXISTS DatabaseMetadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`);
      sqlDb.run(`INSERT OR REPLACE INTO DatabaseMetadata (key, value, updated_at)
              VALUES (?, ?, datetime('now'))`, ['version', newVersion]);
      sqlDb.run(`INSERT OR REPLACE INTO DatabaseMetadata (key, value, updated_at)
              VALUES (?, ?, datetime('now'))`, ['last_updated', new Date().toISOString()]);

      const data = sqlDb.export();
      fs.writeFileSync(databasePath, data);
      sqlDb.close();

      log && log(`Database version updated to: ${newVersion}`);
      return true;
    } catch (err) {
      sqlDb.close();
      throw err;
    }
  } catch (error) {
    throw new Error(`Failed to update database version: ${error.message}`);
  }
}

function tempDownloadPath() {
  return path.join(os.tmpdir(), `temp_database_download_${Date.now()}.zip`);
}

module.exports = {
  getLocalDatabaseVersion,
  verifyDatabase,
  createBackup,
  updateDatabaseVersion,
  tempDownloadPath,
};
