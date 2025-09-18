async function requestSignedUrl({ token, fileId, version }) {
  if (!token) {
    throw new Error('Distribution token is required to request a download URL.');
  }
  throw new Error('Token service integration is not yet implemented.');
}

module.exports = {
  requestSignedUrl,
};
