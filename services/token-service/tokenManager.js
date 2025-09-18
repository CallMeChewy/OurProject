const { v4: uuidv4 } = require('uuid');
const { Timestamp } = require('firebase-admin/firestore');
const { getFirestore } = require('./admin');

function parseExpiry(hours) {
  if (!hours) return null;
  const expires = new Date();
  expires.setHours(expires.getHours() + hours);
  return Timestamp.fromDate(expires);
}

async function createToken({ tier, maxDownloads, expiresInHours }) {
  const firestore = getFirestore();
  const tokenId = uuidv4();
  const now = Timestamp.now();
  const doc = {
    tier,
    status: 'active',
    issuedAt: now,
    usageCount: 0,
    maxDownloads: maxDownloads ?? null,
    expiresAt: parseExpiry(expiresInHours),
  };

  await firestore.collection('tokens').doc(tokenId).set(doc);
  return { tokenId, ...doc };
}

async function revokeToken(tokenId) {
  const firestore = getFirestore();
  const docRef = firestore.collection('tokens').doc(tokenId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error(`Token ${tokenId} not found`);
  }
  await docRef.update({ status: 'revoked', revokedAt: Timestamp.now() });
}

async function listTokens({ status }) {
  const firestore = getFirestore();
  let query = firestore.collection('tokens');
  if (status) {
    query = query.where('status', '==', status);
  }
  const snapshot = await query.orderBy('issuedAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function issueDownloadUrl({ tokenId, version }) {
  const firestore = getFirestore();
  const tokenDoc = await firestore.collection('tokens').doc(tokenId).get();
  if (!tokenDoc.exists) {
    throw new Error('Token not found');
  }
  const token = tokenDoc.data();
  if (token.status !== 'active') {
    throw new Error(`Token status is ${token.status}`);
  }
  if (token.expiresAt && token.expiresAt.toDate() < new Date()) {
    throw new Error('Token expired');
  }
  if (token.maxDownloads && token.usageCount >= token.maxDownloads) {
    throw new Error('Token quota exceeded');
  }

  const archiveDoc = await firestore.collection('archives').doc(version).get();
  if (!archiveDoc.exists) {
    throw new Error(`Archive version ${version} not found`);
  }
  const archive = archiveDoc.data();

  // TODO: integrate Drive API to produce a signed URL
  const signedUrl = `https://drive.google.com/uc?export=download&id=${archive.fileId}`;

  await tokenDoc.ref.update({
    usageCount: (token.usageCount || 0) + 1,
    lastUsedAt: Timestamp.now(),
  });

  return {
    downloadUrl: signedUrl,
    archive,
    token: {
      id: tokenId,
      tier: token.tier,
      usageCount: (token.usageCount || 0) + 1,
      maxDownloads: token.maxDownloads ?? null,
    },
  };
}

module.exports = {
  createToken,
  revokeToken,
  listTokens,
  issueDownloadUrl,
};
