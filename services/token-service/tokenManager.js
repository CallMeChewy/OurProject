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

module.exports = {
  createToken,
  revokeToken,
  listTokens,
};
