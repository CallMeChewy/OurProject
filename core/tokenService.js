const tokenClient = require('./modules/tokenClient');

class TokenService {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.OURLIBRARY_TOKEN_ENDPOINT || process.env.OURLIBRARY_TOKEN_HTTP_ENDPOINT || null;
    this.defaultToken = options.token || process.env.OURLIBRARY_TOKEN || null;
    this.cache = new Map();
    this.cacheTtlMs = options.cacheTtlMs || 5 * 60 * 1000; // default: 5 minutes
    this.now = options.now || (() => Date.now());
  }

  setEndpoint(endpoint) {
    this.endpoint = endpoint;
  }

  setDefaultToken(token) {
    this.defaultToken = token;
  }

  cacheKey({ token, fileId, version }) {
    return `${token}:${fileId}:${version}`;
  }

  getCachedEntry(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    const entry = this.cache.get(key);
    if (this.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  setCacheEntry(key, value) {
    this.cache.set(key, { value, timestamp: this.now() });
  }

  clearCache() {
    this.cache.clear();
  }

  async requestSignedUrl({ token, fileId, version, forceRefresh = false }) {
    const resolvedToken = token || this.defaultToken;
    if (!resolvedToken) {
      throw new Error('Distribution token is not configured.');
    }

    const key = this.cacheKey({ token: resolvedToken, fileId, version });
    if (!forceRefresh) {
      const cached = this.getCachedEntry(key);
      if (cached) {
        return cached;
      }
    }

    const result = await tokenClient.requestSignedUrl({
      token: resolvedToken,
      fileId,
      version,
      endpoint: this.endpoint,
    });

    this.setCacheEntry(key, result);
    return result;
  }

  async getDownloadUrl({ token, fileId, version, forceRefresh = false }) {
    const result = await this.requestSignedUrl({ token, fileId, version, forceRefresh });
    return result.url;
  }
}

module.exports = TokenService;
