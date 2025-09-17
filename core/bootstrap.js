const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const axios = require('axios'); // For future token service calls
const fileSystem = require('./modules/filesystem');
const manifestUtils = require('./modules/manifest');

class Bootstrap {
    constructor(options = {}) {
        this.setupProgress = {
            fileSystem: false,
            database: false,
            config: false,
            ready: false
        };
        this.progressCallback = null;
        this.logCallback = null;
        this.appDir = null; // This will be the ~/OurLibrary directory
        this.config = null;
        this.versionUrl = options.manifestUrl || process.env.OURLIBRARY_MANIFEST_URL || 'https://ourlibrary.github.io/manifest.json';
        this.appVersion = options.appVersion || null;
        this.sqlJsAssetRoots = Array.isArray(options.sqlJsAssetRoots) ? options.sqlJsAssetRoots : [];
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    setLogCallback(callback) {
        this.logCallback = callback;
    }

    log(message) {
        console.log(`[Bootstrap] ${message}`);
        if (this.logCallback) {
            this.logCallback(message);
        }
    }

    updateProgress(step, completed, message) {
        this.setupProgress[step] = completed;
        if (this.progressCallback) {
            this.progressCallback(step, completed, message);
        }
    }

    // --- File System Initialization ---
    async initializeFileSystem() {
        this.log('Initializing file system structure...');
        this.updateProgress('fileSystem', false, 'Creating directory structure');

        try {
            const { appDir, config } = fileSystem.prepareFileSystem({
                log: this.log.bind(this),
                getAppVersion: () => this.getAppVersion()
            });

            this.appDir = appDir;
            this.config = config;

            this.updateProgress('fileSystem', true, 'File system ready');
            this.log('File system initialization completed');
            return true;

        } catch (error) {
            this.log(`File system initialization failed: ${error.message}`);
            throw error;
        }
    }

    resolveConfigPath(relativePath) {
        return fileSystem.resolveConfigPath(this.appDir, relativePath);
    }

    getAppDirectory() {
        return this.appDir;
    }

    getConfigPath() {
        if (!this.appDir) {
            throw new Error('Application directory not set');
        }
        return path.join(this.appDir, 'user_data', 'config.json');
    }

    getConfig() {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }
        return this.config;
    }

    getDatabasePath() {
        const cfg = this.getConfig();
        return this.resolveConfigPath(cfg.database_path);
    }

    getDownloadsDir() {
        const cfg = this.getConfig();
        return this.resolveConfigPath(cfg.downloads_dir);
    }

    getCacheDir() {
        const cfg = this.getConfig();
        return this.resolveConfigPath(cfg.cache_dir);
    }

    getAppVersion() {
        if (this.appVersion) {
            return this.appVersion;
        }

        // Attempt to read version from the process working directory as a fallback.
        try {
            const packagePath = path.join(process.cwd(), 'package.json');
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageData.version || '1.0.0';
        } catch (error) {
            console.warn('Could not resolve app version from package.json:', error.message);
            return '1.0.0';
        }
    }

    resolveSqlJsAsset(filename) {
        const resourcePath = process.resourcesPath
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'Assets', 'sql.js')
            : null;

        const candidateRoots = [
            ...this.sqlJsAssetRoots,
            path.join(__dirname, '..', 'app', 'Assets', 'sql.js'),
            path.join(process.cwd(), 'app', 'Assets', 'sql.js'),
            path.join(process.cwd(), 'Assets', 'sql.js'),
            resourcePath,
        ].filter(Boolean);

        for (const root of candidateRoots) {
            try {
                const candidate = path.join(root, filename);
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            } catch (error) {
                // Ignore missing paths and continue searching.
            }
        }

        // Fallback to relative path for development environments.
        return path.join(__dirname, '..', 'app', 'Assets', 'sql.js', filename);
    }

    // --- Database Update Logic ---
    async getRemoteManifest() {
        try {
            return await manifestUtils.fetchRemoteManifest(this.versionUrl);
        } catch (error) {
            this.log(`Error fetching remote manifest: ${error.message}`);
            const fallback = manifestUtils.loadFallbackManifest({
                explicitFallback: process.env.OURLIBRARY_MANIFEST_FALLBACK,
                cwd: process.cwd(),
                dirname: __dirname,
                resourcesPath: process.resourcesPath,
                log: this.log.bind(this),
                sourceError: error
            });
            if (fallback) {
                return fallback;
            }
            throw error;
        }
    }

    async getLocalDatabaseVersion() {
        const dbPath = path.join(this.appDir, this.config.database_path);
        try {
            if (!fs.existsSync(dbPath)) {
                return { version: '0.0.0', exists: false };
            }

            const SQL = await initSqlJs({ locateFile: (filename) => this.resolveSqlJsAsset(filename) });
            const fileBuffer = fs.readFileSync(dbPath);
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
                this.log('No version found in database metadata, assuming 0.0.0');
                db.close();
                return { version: '0.0.0', exists: true };
            }
        } catch (error) {
            this.log(`Error opening database for version check: ${error.message}`);
            return { version: '0.0.0', exists: false };
        }
    }

    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);

        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;

            if (v1part < v2part) return -1;
            if (v1part > v2part) return 1;
        }
        return 0;
    }

    async checkForUpdates() {
        try {
            const [remoteManifest, localVersion] = await Promise.all([
                this.getRemoteManifest(),
                this.getLocalDatabaseVersion()
            ]);

            const localVersionString = localVersion.version;
            const latestVersionString = remoteManifest.latest_version;
            const minimumVersionString = remoteManifest.minimum_required_version;

            const isLatest = this.compareVersions(localVersionString, latestVersionString) >= 0;
            const meetsMinimum = this.compareVersions(localVersionString, minimumVersionString) >= 0;

            let updateStatus;
            if (isLatest) {
                updateStatus = 'up-to-date';
            } else if (!meetsMinimum) {
                updateStatus = 'mandatory';
            } else {
                updateStatus = 'optional';
            }

            return {
                status: updateStatus,
                local: { version: localVersionString, exists: localVersion.exists },
                remote: remoteManifest,
                needsUpdate: !isLatest
            };

        } catch (error) {
            this.log(`Update check failed: ${error.message}`);
            return {
                status: 'error',
                error: error.message,
                local: { version: 'unknown', exists: false },
                remote: null,
                needsUpdate: false
            };
        }
    }

    async downloadDatabase(manifestEntry, progressCallback) {
        this.log(`Downloading database from: ${manifestEntry.download_url}`);
        const tempPath = path.join(os.tmpdir(), `temp_database_download_${Date.now()}.zip`);
        const dbPath = path.join(this.appDir, this.config.database_path);

        // TODO: Implement token service call to get a signed URL for the database archive
        // For now, we'll assume manifestEntry.download_url is a direct, publicly accessible URL
        // In the future, this will involve: 
        // 1. Calling the Firebase Cloud Function to get a signed URL for manifestEntry.file_id
        // 2. Downloading the file from the signed URL

        try {
            const response = await axios({
                method: 'get',
                url: manifestEntry.download_url,
                responseType: 'stream'
            });

            const totalBytes = parseInt(response.headers['content-length'], 10);
            let downloadedBytes = 0;

            const writer = fs.createWriteStream(tempPath);
            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                if (progressCallback && totalBytes) {
                    const progress = (downloadedBytes / totalBytes) * 100;
                    progressCallback(progress, downloadedBytes, totalBytes);
                }
            });
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // TODO: Verify SHA-256 hash of the downloaded file against manifestEntry.sha256
            this.log('Downloaded database archive. SHA-256 verification skipped for now.');

            // TODO: Extract the database from the zip archive
            // For now, assuming the download_url points directly to the .db file
            // This will need to be updated to handle zip extraction.
            await this.createBackup(dbPath);
            fs.copyFileSync(tempPath, dbPath); // Assuming tempPath is the .db file for now
            fs.unlinkSync(tempPath);

            this.log('Database updated successfully');
            return true;
        } catch (error) {
            this.log(`Database download failed: ${error.message}`);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            throw error;
        }
    }

    async verifyDatabase(providedDbPath = null) {
        const dbPath = providedDbPath || path.join(this.appDir, this.config.database_path);
        try {
            if (!fs.existsSync(dbPath)) {
                throw new Error('Database file does not exist');
            }

            const SQL = await initSqlJs({ locateFile: (filename) => this.resolveSqlJsAsset(filename) });
            const fileBuffer = fs.readFileSync(dbPath);
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
        } catch (error) {
            throw new Error(`Database file is not valid: ${error.message}`);
        }
    }

    async ensureDatabasePlaceholder() {
        const dbPath = path.join(this.appDir, this.config.database_path);
        if (fs.existsSync(dbPath)) {
            return;
        }

        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.closeSync(fs.openSync(dbPath, 'w'));
        this.log(`Created placeholder database at ${dbPath}`);
    }

    async createBackup(dbPath) {
        if (!fs.existsSync(dbPath)) {
            return;
        }
        const backupDir = path.join(path.dirname(dbPath), 'Backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `OurLibrary_backup_${timestamp}.db`);
        fs.copyFileSync(dbPath, backupPath);
        this.log(`Database backed up to: ${backupPath}`);
    }

    async updateDatabaseVersion(newVersion) {
        const dbPath = path.join(this.appDir, this.config.database_path);
        try {
            const SQL = await initSqlJs({ locateFile: (filename) => this.resolveSqlJsAsset(filename) });

            let sqlDb;
            if (fs.existsSync(dbPath)) {
                const fileBuffer = fs.readFileSync(dbPath);
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
                fs.writeFileSync(dbPath, data);
                sqlDb.close();

                this.log(`Database version updated to: ${newVersion}`);
                return true;
            } catch (err) {
                sqlDb.close();
                throw err;
            }
        } catch (error) {
            throw new Error(`Failed to update database version: ${error.message}`);
        }
    }

    // --- Full Installation / Update Orchestration ---
    async performFullInstallation() {
        this.log('Starting OurLibrary installation/update...');

        try {
            await this.initializeFileSystem();
            
            // Load config after filesystem is initialized and initial config is created
            const { config } = fileSystem.loadConfig(this.appDir, {
                appVersion: this.getAppVersion(),
                log: this.log.bind(this)
            });

            this.config = config;

            const updateCheck = await this.checkForUpdates();

            if (updateCheck.status === 'up-to-date' && updateCheck.local.exists) {
                this.log('Application and database are already up to date.');
                this.updateProgress('database', true, 'Database up to date');
                this.updateProgress('config', true, 'Configuration up to date');
                this.setupProgress.ready = true;
                this.updateProgress('ready', true, 'Installation complete!');
                return { success: true, message: 'Application is up to date.' };
            }

            if (updateCheck.status === 'error') {
                throw new Error(`Update check failed: ${updateCheck.error}`);
            }

            this.log(`Update status: ${updateCheck.status}. Local: ${updateCheck.local.version}, Remote: ${updateCheck.remote.latest_version}`);

            // Download and update database if needed
            const archiveEntry = updateCheck.remote ? updateCheck.remote.database_archive : null;
            const hasDownload = archiveEntry && archiveEntry.download_url;

            if (updateCheck.needsUpdate || !updateCheck.local.exists) {
                if (hasDownload) {
                    this.updateProgress('database', false, 'Downloading latest database...');
                    await this.downloadDatabase(archiveEntry, (progress, downloaded, total) => {
                        const progressMessage = `Downloading database... ${progress.toFixed(1)}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
                        this.updateProgress('database', false, progressMessage);
                        this.log(`Download progress: ${progress.toFixed(1)}%`);
                    });
                    await this.updateDatabaseVersion(updateCheck.remote.latest_version);
                    this.updateProgress('database', true, 'Database installed/updated successfully');
                } else {
                    this.log('No download URL provided in manifest; creating placeholder database.');
                    await this.ensureDatabasePlaceholder();
                    this.updateProgress('database', true, 'Database placeholder ready');
                }
            } else {
                this.updateProgress('database', true, 'Database already up to date');
            }

            // Final configuration update
            await this.configureApplication(updateCheck.remote.latest_version);

            this.setupProgress.ready = true;
            this.updateProgress('ready', true, 'Installation complete!');

            this.log('Installation/Update completed successfully!');
            return { success: true, message: 'Installation/Update completed successfully' };

        } catch (error) {
            this.log(`Installation/Update failed: ${error.message}`);
            return { success: false, error: error.message, message: 'Installation/Update failed' };
        }
    }

    async configureApplication(installedVersion) {
        this.log('Configuring application...');
        this.updateProgress('config', false, 'Applying configuration');

        try {
            const configPath = path.join(this.appDir, 'user_data', 'config.json');
            let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            config.installation_date = new Date().toISOString();
            config.installation_version = installedVersion || this.getAppVersion();
            config.installation_complete = true;
            config.app_directory = this.appDir;

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            this.updateProgress('config', true, 'Configuration complete');
            this.log('Application configuration completed');
            return true;

        } catch (error) {
            this.log(`Configuration failed: ${error.message}`);
            throw error;
        }
    }

    getInstallationStatus() {
        return {
            progress: this.setupProgress,
            isComplete: this.setupProgress.ready,
            readyToLaunch: this.setupProgress.fileSystem &&
                          this.setupProgress.database &&
                          this.setupProgress.config
        };
    }

    async verifyInstallation() {
        this.log('Verifying installation...');

        try {
            // Check file system (basic check for appDir existence)
            if (!fs.existsSync(this.appDir)) {
                throw new Error(`OurLibrary directory not found at ${this.appDir}`);
            }
            // Load config to get database path
            const configPath = path.join(this.appDir, 'user_data', 'config.json');
            if (!fs.existsSync(configPath)) {
                throw new Error(`Config file not found at ${configPath}`);
            }
            this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

            // Check database
            await this.verifyDatabase();

            this.log('Installation verification passed');
            return { verified: true, message: 'Installation is valid' };

        } catch (error) {
            this.log(`Installation verification failed: ${error.message}`);
            return { verified: false, error: error.message };
        }
    }
}

module.exports = Bootstrap;
