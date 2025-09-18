const axios = require('axios');

const DEFAULT_ENDPOINT = process.env.OURLIBRARY_TOKEN_ENDPOINT
  || process.env.OURLIBRARY_TOKEN_HTTP_ENDPOINT
  || 'https://us-central1-your-project.cloudfunctions.net/issueDownloadUrlHttp';

async function requestSignedUrl({ token, fileId, version, endpoint = DEFAULT_ENDPOINT, timeoutMs = 15000 }) {
  if (!token) {
    throw new Error('Distribution token is required to request a download URL.');
  }
  if (!fileId) {
    throw new Error('fileId is required to request a download URL.');
  }
  if (!version) {
    throw new Error('version is required to request a download URL.');
  }
  if (!endpoint) {
    throw new Error('Token service endpoint is not configured.');
  }

  const payload = { token, fileId, version };

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status !== 200 || !response.data) {
      throw new Error(`Token service responded with status ${response.status}`);
    }

    if (response.data.error) {
      const err = new Error(response.data.error.message || 'Token service reported an error');
      err.code = response.data.error.code;
      throw err;
    }

    const { downloadUrl, quotaRemaining, quotaLimit, archive } = response.data;
    if (!downloadUrl) {
      throw new Error('Token service did not return a download URL');
    }

    return {
      url: downloadUrl,
      archive: archive || null,
      quotaRemaining,
      quotaLimit,
      raw: response.data,
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
