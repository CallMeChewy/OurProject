const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const yauzl = require('yauzl');
const axios = require('axios'); // For future token service calls
const fileSystem = require('./modules/filesystem');
const manifestUtils = require('./modules/manifest');
const databaseUtils = require('./modules/database');
const tokenClient = require('./modules/tokenClient');


function shouldTreatAsZip(downloadInfo) {
    const archive = downloadInfo.archive || {};
    const url = downloadInfo.url || '';
    const hintValues = [
        archive.isZip,
        archive.zip === true,
        typeof archive.contentType === 'string' && archive.contentType.toLowerCase().includes('zip'),
        typeof archive.mimeType === 'string' && archive.mimeType.toLowerCase().includes('zip'),
        typeof archive.fileName === 'string' && /\.zip$/i.test(archive.fileName),
        /\.zip(\?|$)/i.test(url)
    ];
    return hintValues.some(Boolean);
}

async function extractDatabaseFromZip({ zipPath, destinationPath, archive, log }) {
    const preferredEntry = archive && typeof archive.innerPath === 'string' ? archive.innerPath.replace(/^\/+/, '') : null;

    return new Promise((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err) return reject(err);
            let settled = false;
            let matched = false;

            const done = (error) => {
                if (settled) return;
                settled = true;
                try {
                    zipfile.close();
                } catch (closeErr) {
                    if (!error && closeErr) {
                        error = closeErr;
                    }
                }
                if (error) {
                    reject(error);
                } else {
                    resolve(destinationPath);
                }
            };

            zipfile.on('entry', (entry) => {
                const rawName = entry.fileName.replace(/\\/g, '/').replace(/^\/+/, '');
                const isDirectory = /\/$/.test(rawName);
                if (isDirectory) {
                    zipfile.readEntry();
                    return;
                }

                const matchesPreferred = preferredEntry ? rawName === preferredEntry : /\.db$/i.test(rawName);
                if (!matchesPreferred) {
                    zipfile.readEntry();
                    return;
                }

                matched = true;
                zipfile.openReadStream(entry, (streamErr, readStream) => {
                    if (streamErr) {
                        done(streamErr);
                        return;
                    }
                    const writeStream = fs.createWriteStream(destinationPath);
                    pipeline(readStream, writeStream)
                        .then(() => done())
                        .catch(done);
                });
            });

            zipfile.on('end', () => {
                if (!matched) {
                    done(new Error('Database file not found in archive'));
                }
            });

            zipfile.on('error', done);
            zipfile.readEntry();
        });
    });
}

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

    getDistributionToken() {
        const cfg = this.getConfig();
        return cfg.distribution_token || null;
    }

    async setDistributionToken(token) {
        const cfg = this.getConfig();
        cfg.distribution_token = token;
        this.config = cfg;
        fileSystem.saveConfig(this.appDir, cfg, { log: this.log.bind(this) });
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
        const databasePath = this.getDatabasePath();
        return databaseUtils.getLocalDatabaseVersion({
            databasePath,
            resolveSqlJsAsset: (filename) => this.resolveSqlJsAsset(filename),
            log: this.log.bind(this)
        });
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

    async resolveDownloadInfo(manifestEntry) {
        if (!manifestEntry) {
            throw new Error('Manifest entry missing');
        }

        if (manifestEntry.download_url) {
            return {
                url: manifestEntry.download_url,
                archive: manifestEntry
            };
        }

        if (manifestEntry.file_id) {
            const token = this.getDistributionToken() || process.env.OURLIBRARY_TOKEN;
            if (!token) {
                throw new Error('Distribution token not configured');
            }

            return tokenClient.requestSignedUrl({
                token,
                fileId: manifestEntry.file_id,
                version: manifestEntry.version || manifestEntry.latest_version || this.getAppVersion()
            });
        }

        throw new Error('Manifest does not provide download location');
    }

    async downloadDatabase(downloadInfo, progressCallback) {
        this.log(`Downloading database from: ${downloadInfo.url}`);
        const tempPath = databaseUtils.tempDownloadPath();
        const dbPath = this.getDatabasePath();

        // downloadInfo.url may be a direct link or a short-lived Drive URL from the token service.
        // The caller (resolveDownloadInfo) already handled token validation and link issuance.

        const isZipArchive = shouldTreatAsZip(downloadInfo);
        let extractedPath = null;

        try {
            const response = await axios({
                method: 'get',
                url: downloadInfo.url,
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

            const expectedSha = downloadInfo.archive && typeof downloadInfo.archive.sha256 === 'string'
                ? downloadInfo.archive.sha256.trim().toLowerCase()
                : null;

            if (expectedSha) {
                const actualSha = await new Promise((resolve, reject) => {
                    const hash = crypto.createHash('sha256');
                    const stream = fs.createReadStream(tempPath);
                    stream.on('error', reject);
                    stream.on('data', (chunk) => hash.update(chunk));
                    stream.on('end', () => resolve(hash.digest('hex')));
                });

                if (actualSha !== expectedSha) {
                    try {
                        fs.unlinkSync(tempPath);
                    } catch (cleanupError) {
                        this.log(`Failed to remove temp archive after hash mismatch: ${cleanupError.message}`);
                    }
                    throw new Error(`Downloaded archive failed integrity check (expected ${expectedSha}, got ${actualSha})`);
                }
                this.log('Downloaded database archive. SHA-256 verification passed.');
            } else {
                this.log('Downloaded database archive. SHA-256 verification skipped (no hash provided).');
            }

            let sourcePath = tempPath;
            if (isZipArchive) {
                extractedPath = path.join(path.dirname(tempPath), `ourlibrary_extracted_${Date.now()}.db`);
                await extractDatabaseFromZip({ zipPath: tempPath, destinationPath: extractedPath, archive: downloadInfo.archive, log: this.log.bind(this) });
                sourcePath = extractedPath;
            }

            await this.createBackup(dbPath);
            fs.copyFileSync(sourcePath, dbPath);

            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            if (extractedPath && fs.existsSync(extractedPath)) {
                fs.unlinkSync(extractedPath);
            }

            this.log('Database updated successfully');
            return true;
        } catch (error) {
            this.log(`Database download failed: ${error.message}`);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            if (extractedPath && fs.existsSync(extractedPath)) {
                try {
                    fs.unlinkSync(extractedPath);
                } catch (cleanupError) {
                    this.log(`Failed to remove extracted database after error: ${cleanupError.message}`);
                }
            }
            throw error;
        }
    }

    async verifyDatabase(providedDbPath = null) {
        const databasePath = providedDbPath || this.getDatabasePath();
        return databaseUtils.verifyDatabase({
            databasePath,
            resolveSqlJsAsset: (filename) => this.resolveSqlJsAsset(filename)
        });
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
        databaseUtils.createBackup({ databasePath: dbPath, log: this.log.bind(this) });
    }

    async updateDatabaseVersion(newVersion) {
        const databasePath = this.getDatabasePath();
        return databaseUtils.updateDatabaseVersion({
            databasePath,
            resolveSqlJsAsset: (filename) => this.resolveSqlJsAsset(filename),
            log: this.log.bind(this),
            newVersion
        });
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

            if (updateCheck.needsUpdate || !updateCheck.local.exists) {
                let downloadInfo = null;
                if (archiveEntry) {
                    try {
                        downloadInfo = await this.resolveDownloadInfo(archiveEntry);
                    } catch (error) {
                        this.log(`Unable to resolve download info: ${error.message}`);
                    }
                }

                if (downloadInfo) {
                    this.updateProgress('database', false, 'Downloading latest database...');
                    await this.downloadDatabase(downloadInfo, (progress, downloaded, total) => {
                        const progressMessage = `Downloading database... ${progress.toFixed(1)}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`;
                        this.updateProgress('database', false, progressMessage);
                        this.log(`Download progress: ${progress.toFixed(1)}%`);
                    });
                    await this.updateDatabaseVersion(updateCheck.remote.latest_version);
                    this.updateProgress('database', true, 'Database installed/updated successfully');
                } else {
                    this.log('No download source available; creating placeholder database.');
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
            const { config } = fileSystem.loadConfig(this.appDir, {
                appVersion: this.getAppVersion(),
                log: this.log.bind(this)
            });

            config.installation_date = new Date().toISOString();
            config.installation_version = installedVersion || this.getAppVersion();
            config.installation_complete = true;
            config.app_directory = this.appDir;

            fileSystem.saveConfig(this.appDir, config, { log: this.log.bind(this) });
            this.config = config;

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
