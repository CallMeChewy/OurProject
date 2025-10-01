/**
 * Reads and validates environment-backed configuration for Cloud Functions.
 */

/**
 * Fetches an environment variable and optionally marks it as required.
 * @param {string} name Environment variable key.
 * @param {Object} [options] Optional settings.
 * @param {boolean} [options.required=false] Whether the value is mandatory.
 * @param {string|null} [options.defaultValue=null] Fallback value.
 * @return {string|null} Value or null when not required.
 */
function getEnv(name, {required = false, defaultValue = null} = {}) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue;
  }
  return value;
}

/**
 * Converts boolean-like strings into native booleans.
 * @param {string|boolean|undefined|null} value Raw value.
 * @return {boolean} Parsed boolean.
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

/**
 * Retrieves Google Drive service account credentials.
 * @return {Object} Drive credentials.
 */
function getDriveConfig() {
  const clientEmail = getEnv('DRIVE_CLIENT_EMAIL', {required: true});
  const privateKey = getEnv('DRIVE_PRIVATE_KEY', {required: true});
  return {clientEmail, privateKey};
}

/**
 * Retrieves SMTP configuration for transactional email.
 * @return {Object} SMTP connection details.
 */
function getSmtpConfig() {
  const host = getEnv('SMTP_HOST', {required: true});
  const port = Number(getEnv('SMTP_PORT', {required: true}));
  const secure = parseBoolean(getEnv('SMTP_SECURE', {defaultValue: 'false'}));
  const user = getEnv('SMTP_USER', {required: true});
  const pass = getEnv('SMTP_PASS', {required: true});
  const from = getEnv('SMTP_FROM', {defaultValue: user});

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('SMTP_PORT must be a positive integer');
  }

  return {host, port, secure, user, pass, from};
}

module.exports = {
  getDriveConfig,
  getSmtpConfig,
  parseBoolean,
  getEnv,
};
