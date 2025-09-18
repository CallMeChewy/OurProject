const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();
const firestore = admin.firestore();
const drive = google.drive('v3');

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

async function generateSignedUrl({ fileId }) {
  // Placeholder integration — replace with Drive API signed URL
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

exports.issueDownloadUrl = functions.https.onCall(async (data, context) => {
  const { token, fileId, version } = data;
  if (!token || !fileId || !version) {
    throw new functions.https.HttpsError('invalid-argument', 'token, fileId, and version are required');
  }

  const now = new Date();
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
});
