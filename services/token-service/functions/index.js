const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { generateWebContentLink } = require('../driveClient');

admin.initializeApp();
const firestore = admin.firestore();

function verifyToken(doc, { now }) {
  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Token not found');
  }
  const data = doc.data();
  if (data.status !== 'active') {
    throw new functions.https.HttpsError('permission-denied', 'Token is not active');
  }
  if (data.expiresAt && data.expiresAt.toDate() < now) {
    throw new functions.https.HttpsError('permission-denied', 'Token expired');
  }
  if (data.maxDownloads && data.usageCount >= data.maxDownloads) {
    throw new functions.https.HttpsError('resource-exhausted', 'Token quota exceeded');
  }
  return data;
}

async function getArchiveMetadata(version) {
  const doc = await firestore.collection('archives').doc(version).get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', `Archive version ${version} not found`);
  }
  return doc.data();
}

function getDriveCredentials() {
  const driveConfig = functions.config().drive || {};
  const { client_email: clientEmail, private_key: privateKey } = driveConfig;
  if (!clientEmail || !privateKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Drive API credentials are not configured'
    );
  }
  return { clientEmail, privateKey };
}

async function generateSignedUrl({ fileId }) {
  const { clientEmail, privateKey } = getDriveCredentials();
  let downloadUrl;
  try {
    downloadUrl = await generateWebContentLink({ clientEmail, privateKey, fileId });
  } catch (error) {
    throw new functions.https.HttpsError('failed-precondition', 'Failed to generate Drive download link', error);
  }

  if (!downloadUrl) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Drive file is not accessible or shareable'
    );
  }

  return downloadUrl;
}

async function issueDownload({ token, fileId, version, now = new Date() }) {
  if (!token || !fileId || !version) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'token, fileId, and version are required'
    );
  }

  const tokenRef = firestore.collection('tokens').doc(token);
  const tokenDoc = await tokenRef.get();
  const tokenData = verifyToken(tokenDoc, { now });

  const archive = await getArchiveMetadata(version);
  if (archive.fileId !== fileId) {
    throw new functions.https.HttpsError('invalid-argument', 'fileId mismatch for requested version');
  }

  const downloadUrl = await generateSignedUrl({ fileId });

  await tokenRef.update({
    usageCount: admin.firestore.FieldValue.increment(1),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const usageCount = (tokenData.usageCount || 0) + 1;
  return {
    downloadUrl,
    archive,
    quotaRemaining: tokenData.maxDownloads ? tokenData.maxDownloads - usageCount : null,
    quotaLimit: tokenData.maxDownloads ?? null,
  };
}

function mapHttpsErrorToStatus(code) {
  const mapping = {
    'invalid-argument': 400,
    'failed-precondition': 400,
    'out-of-range': 400,
    'unauthenticated': 401,
    'permission-denied': 403,
    'not-found': 404,
    'already-exists': 409,
    'aborted': 409,
    'resource-exhausted': 429,
    'cancelled': 499,
    'data-loss': 500,
    'unknown': 500,
    'internal': 500,
    'unavailable': 503,
    'deadline-exceeded': 504,
  };
  return mapping[code] || 500;
}

exports.issueDownloadUrl = functions.https.onCall(async (data, context) => issueDownload({
  token: data.token,
  fileId: data.fileId,
  version: data.version,
}));

exports.issueDownloadUrlHttp = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const { token, fileId, version } = req.body || {};

  try {
    const result = await issueDownload({ token, fileId, version });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      const status = mapHttpsErrorToStatus(error.code);
      res.status(status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }
    console.error('Unexpected error issuing download URL:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
