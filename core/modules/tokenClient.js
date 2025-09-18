const axios = require('axios');

async function requestSignedUrl({ token, fileId, version }) {
  if (!token) {
    throw new Error('Distribution token is required to request a download URL.');
  }

  const endpoint = process.env.OURLIBRARY_TOKEN_ENDPOINT
    || 'https://us-central1-your-project.cloudfunctions.net/issueDownloadUrl';

  const payload = {
    token,
    fileId,
    version,
  };

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: 15000,
    });

    if (response.status !== 200 || !response.data) {
      throw new Error(`Token service responded with status ${response.status}`);
    }

    const { downloadUrl, quotaRemaining, quotaLimit } = response.data;
    if (!downloadUrl) {
      throw new Error('Token service did not return a download URL');
    }

    return {
      url: downloadUrl,
      archive: response.data.archive || null,
      quotaRemaining,
      quotaLimit,
    };
  } catch (error) {
    if (error.response && error.response.data) {
      const { message, code } = error.response.data;
      const err = new Error(message || 'Token service request failed');
      err.code = code;
      throw err;
    }
    throw error;
  }
}

module.exports = {
  requestSignedUrl,
};
