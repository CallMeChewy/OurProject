const {google} = require('googleapis');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
let cachedClient;
let cachedKey;

/**
 * Normalizes service account private key text for JWT usage.
 * @param {string} privateKey PEM key value from config.
 * @return {string} Private key with newline characters restored.
 */
function normalizePrivateKey(privateKey) {
  if (!privateKey) {
    throw new Error('Drive private key is missing');
  }
  return privateKey.includes('\n') ? privateKey : privateKey.replace(/\\n/g, '\n');
}

/**
 * Returns a cached Drive client configured for the service account.
 * @param {Object} params Auth credentials.
 * @param {string} params.clientEmail Service account email.
 * @param {string} params.privateKey Service account private key.
 * @return {Object} Drive API client instance.
 */
function getDriveClient({clientEmail, privateKey}) {
  if (!clientEmail) {
    throw new Error('Drive client email is missing');
  }
  const normalizedKey = normalizePrivateKey(privateKey);
  const cacheKey = `${clientEmail}:${normalizedKey}`;
  if (cachedClient && cachedKey === cacheKey) {
    return cachedClient;
  }
  const jwtClient = new google.auth.JWT(clientEmail, null, normalizedKey, [DRIVE_SCOPE]);
  cachedClient = google.drive({version: 'v3', auth: jwtClient});
  cachedKey = cacheKey;
  return cachedClient;
}

/**
 * Retrieves the Drive web content link for a given file.
 * @param {Object} params Drive client and file id.
 * @param {Object} params.driveClient Drive API client.
 * @param {string} params.fileId Drive file id.
 * @return {Promise<string>} Signed download URL.
 */
async function fetchWebContentLink({driveClient, fileId}) {
  const response = await driveClient.files.get({
    fileId,
    fields: 'webContentLink',
  });
  return response.data.webContentLink;
}

/**
 * Generates a web content link using provided Drive credentials.
 * @param {Object} params Drive auth and file id.
 * @param {string} params.clientEmail Service account email.
 * @param {string} params.privateKey Service account key.
 * @param {string} params.fileId Drive file id.
 * @return {Promise<string>} Signed download URL.
 */
async function generateWebContentLink({clientEmail, privateKey, fileId}) {
  const driveClient = getDriveClient({clientEmail, privateKey});
  return fetchWebContentLink({driveClient, fileId});
}

module.exports = {
  getDriveClient,
  fetchWebContentLink,
  generateWebContentLink,
};
