// Global state
let currentToken = null;
let databaseReady = false;

// DOM elements
const tokenModal = document.getElementById('tokenModal');
const tokenForm = document.getElementById('tokenForm');
const tokenInput = document.getElementById('tokenInput');
const tokenStatus = document.getElementById('tokenStatus');
const tokenStatusText = document.getElementById('tokenStatusText');
const tokenMessage = document.getElementById('tokenMessage');
const validateTokenBtn = document.getElementById('validateTokenBtn');
const databaseStatus = document.getElementById('databaseStatus');
const databaseStatusText = document.getElementById('databaseStatusText');
const searchInterface = document.getElementById('searchInterface');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await checkStoredToken();
    setupEventListeners();
});

async function checkStoredToken() {
    try {
        const token = await window.api.token.load();
        if (token) {
            currentToken = token;
            await validateToken(token);
        } else {
            showTokenEntry();
        }
    } catch (error) {
        console.error('Error checking stored token:', error);
        showTokenEntry();
    }
}

function setupEventListeners() {
    // Token form submission
    tokenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = tokenInput.value.trim();
        if (token) {
            await validateAndStoreToken(token);
        }
    });

    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length >= 2) {
            searchTimeout = setTimeout(() => performSearch(query), 300);
        } else if (query.length === 0) {
            clearSearchResults();
        }
    });
}

async function validateAndStoreToken(token) {
    setLoading(validateTokenBtn, 'Validating...');
    clearMessage(tokenMessage);

    try {
        const result = await window.api.token.validate(token);

        if (result.valid) {
            currentToken = token;
            showSuccess(tokenMessage, 'Token validated successfully!');
            updateTokenStatus('Valid Token', true);

            // Initialize database after successful token validation
            setTimeout(async () => {
                await initializeDatabase();
            }, 1500);
        } else {
            showError(tokenMessage, result.error || 'Token validation failed');
            updateTokenStatus('Invalid Token', false);
        }
    } catch (error) {
        console.error('Token validation error:', error);
        showError(tokenMessage, error.message || 'Failed to validate token');
        updateTokenStatus('Token Error', false);
    }

    setLoading(validateTokenBtn, 'Validate Token', false);
}

async function validateToken(token) {
    try {
        const result = await window.api.token.validate(token);
        if (result.valid) {
            currentToken = token;
            hideTokenEntry();
            updateTokenStatus('Valid Token', true);
            await initializeDatabase();
        } else {
            showTokenEntry();
            updateTokenStatus('Invalid Token', false);
        }
    } catch (error) {
        showTokenEntry();
        updateTokenStatus('Token Error', false);
    }
}

async function initializeDatabase() {
    showDatabaseStatus('Initializing library system...');

    try {
        // Set up bootstrap event listeners first
        setupBootstrapListeners();

        const result = await window.api.db.initialize();

        if (result.success) {
            databaseReady = true;
            showDatabaseStatus(`Library ready (v${result.version || 'unknown'}) at: ${result.path}`);
            showSearchInterface();
        } else {
            showDatabaseStatus(`Library initialization error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Database initialization error:', error);
        showDatabaseStatus(`Failed to initialize library: ${error.message}`, 'error');
    }
}

function setupBootstrapListeners() {
    // Listen for bootstrap progress updates
    window.api.bootstrap.onProgress((event, data) => {
        console.log('Bootstrap progress:', data);
        updateBootstrapProgress(data);
    });

    // Listen for bootstrap log messages
    window.api.bootstrap.onLog((event, message) => {
        console.log('Bootstrap log:', message);
        showDatabaseStatus(message, 'info');
    });

    // Listen for database update notifications
    window.api.bootstrap.onUpdateAvailable((event, data) => {
        console.log('Database update available:', data);
        showDatabaseUpdateNotification(data);
    });
}

function updateBootstrapProgress(data) {
    const { step, completed, message } = data;
    let progressText = message;

    if (step === 'fileSystem') {
        progressText = `📁 ${message}`;
    } else if (step === 'database') {
        progressText = `🗄️  ${message}`;
    } else if (step === 'config') {
        progressText = `⚙️  ${message}`;
    }

    showDatabaseStatus(progressText, completed ? 'success' : 'info');
}

function showDatabaseUpdateNotification(updateInfo) {
    const { currentVersion, availableVersion } = updateInfo;

    const updateModal = document.createElement('div');
    updateModal.className = 'status-message status-info';
    updateModal.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        left: 20px;
        max-width: 500px;
        margin: 0 auto;
        z-index: 1000;
        cursor: pointer;
    `;

    updateModal.innerHTML = `
        <h4>📚 Database Update Available</h4>
        <p>A new version of the library database is available:</p>
        <p><strong>Current:</strong> v${currentVersion}<br>
        <strong>Available:</strong> v${availableVersion}</p>
        <p><em>Click here to download the update</em></p>
    `;

    updateModal.onclick = async () => {
        updateModal.remove();
        await downloadDatabaseUpdate();
    };

    document.body.appendChild(updateModal);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (updateModal.parentNode) {
            updateModal.remove();
        }
    }, 10000);
}

async function downloadDatabaseUpdate() {
    showDatabaseStatus('Downloading database update...', 'info');

    try {
        const result = await window.api.bootstrap.downloadDatabase();

        if (result.success) {
            showDatabaseStatus('Database updated successfully! Reloading...', 'success');

            // Reload the application after a short delay
            setTimeout(() => {
                location.reload();
            }, 2000);
        } else {
            showDatabaseStatus(`Update failed: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Database update error:', error);
        showDatabaseStatus(`Update failed: ${error.message}`, 'error');
    }
}

async function performSearch(query) {
    if (!databaseReady) return;

    showSearchLoading();

    try {
        const result = await window.api.db.searchBooks(query);

        if (result.success) {
            displaySearchResults(result.data);
        } else {
            showError(searchResults, result.error || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError(searchResults, error.message || 'Search failed');
    }
}

function displaySearchResults(books) {
    if (!books || books.length === 0) {
        searchResults.innerHTML = '<div style="text-align: center; opacity: 0.7;">No books found</div>';
        return;
    }

    const booksHtml = books.map(book => `
        <div class="book-item">
            <div class="book-title">${escapeHtml(book.Title || 'Unknown Title')}</div>
            <div class="book-author">${escapeHtml(book.Author || 'Unknown Author')}</div>
            <div class="book-actions">
                <button class="btn btn-small btn-primary" onclick="downloadBook('${book.ID}', '${escapeHtml(book.Title)}')">
                    📥 Download
                </button>
                <button class="btn btn-small btn-secondary" onclick="previewBook('${book.ID}', '${escapeHtml(book.Title)}')">
                    👁️ Preview
                </button>
            </div>
        </div>
    `).join('');

    searchResults.innerHTML = booksHtml;
}

async function downloadBook(bookId, bookTitle) {
    if (!currentToken) {
        showError(searchResults, 'Token required for downloads');
        return;
    }

    try {
        // In a real implementation, this would use the actual book data
        const bookData = {
            id: bookId,
            title: bookTitle,
            fileId: 'placeholder-file-id',
            version: 'latest'
        };

        const result = await window.api.download.book(bookData);

        if (result.success) {
            showSuccess(searchResults, `Download started for: ${bookTitle}`);
        } else {
            showError(searchResults, result.error || 'Download failed');
        }
    } catch (error) {
        console.error('Download error:', error);
        showError(searchResults, error.message || 'Download failed');
    }
}

function previewBook(bookId, bookTitle) {
    showInfo(searchResults, `Preview functionality coming soon for: ${bookTitle}`);
}

// UI Helper Functions
function showTokenEntry() {
    tokenModal.classList.remove('hidden');
    databaseStatus.classList.add('hidden');
    searchInterface.classList.add('hidden');
}

function hideTokenEntry() {
    tokenModal.classList.add('hidden');
}

function showDatabaseStatus(message, type = 'info') {
    databaseStatus.classList.remove('hidden');
    databaseStatusText.textContent = message;
    databaseStatusText.className = type === 'error' ? 'status-error' : 'status-info';
}

function showSearchInterface() {
    searchInterface.classList.remove('hidden');
    searchInput.focus();
}

function showSearchLoading() {
    searchResults.innerHTML = '<div class="loading"></div>';
}

function clearSearchResults() {
    searchResults.innerHTML = '';
}

function updateTokenStatus(text, isValid) {
    tokenStatusText.textContent = text;
    tokenStatus.className = `token-status ${isValid ? 'valid' : 'invalid'}`;
}

function showSuccess(element, message) {
    element.className = 'status-message status-success';
    element.textContent = message;
}

function showError(element, message) {
    element.className = 'status-message status-error';
    element.textContent = message;
}

function showInfo(element, message) {
    element.className = 'status-message status-info';
    element.textContent = message;
}

function clearMessage(element) {
    element.className = '';
    element.textContent = '';
}

function setLoading(button, text, loading = true) {
    button.disabled = loading;
    button.textContent = loading ? `${text}...` : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for onclick handlers
window.downloadBook = downloadBook;
window.previewBook = previewBook;