const path = require('path');
let admin;
let firestore;
let serviceAccount;

function getCredentialsPath() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  return null;
}

function initializeFirebase() {
  if (admin) {
    return admin;
  }

  const credsPath = getCredentialsPath();
  if (!credsPath) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS before running token commands.');
  }

  const resolvedPath = path.resolve(credsPath);
  // Lazy require so we only pay cost when commands run
  // eslint-disable-next-line global-require
  admin = require('firebase-admin');
  // eslint-disable-next-line import/no-dynamic-require, global-require
  serviceAccount = require(resolvedPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return admin;
}

function getServiceAccount() {
  if (serviceAccount) {
    return serviceAccount;
  }
  initializeFirebase();
  return serviceAccount;
}

function getFirestore() {
  if (firestore) {
    return firestore;
  }
  const firebaseAdmin = initializeFirebase();
  firestore = firebaseAdmin.firestore();
  return firestore;
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getServiceAccount,
};
