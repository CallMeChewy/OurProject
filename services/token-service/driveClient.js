const { google } = require('googleapis');

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
let cachedClient;
let cachedKey;

function normalizePrivateKey(privateKey) {
  if (!privateKey) {
    throw new Error('Drive private key is missing');
  }
  return privateKey.includes('\n') ? privateKey : privateKey.replace(/\\n/g, '\n');
}

function getDriveClient({ clientEmail, privateKey }) {
  if (!clientEmail) {
    throw new Error('Drive client email is missing');
  }
  const normalizedKey = normalizePrivateKey(privateKey);
  const cacheKey = `${clientEmail}:${normalizedKey}`;
  if (cachedClient && cachedKey === cacheKey) {
    return cachedClient;
  }
  const jwtClient = new google.auth.JWT(clientEmail, null, normalizedKey, [DRIVE_SCOPE]);
  cachedClient = google.drive({ version: 'v3', auth: jwtClient });
  cachedKey = cacheKey;
  return cachedClient;
}

async function fetchWebContentLink({ driveClient, fileId }) {
  const response = await driveClient.files.get({
    fileId,
    fields: 'webContentLink',
  });
  return response.data.webContentLink;
}

async function generateWebContentLink({ clientEmail, privateKey, fileId }) {
  const driveClient = getDriveClient({ clientEmail, privateKey });
  return fetchWebContentLink({ driveClient, fileId });
}

module.exports = {
  getDriveClient,
  fetchWebContentLink,
  generateWebContentLink,
};
