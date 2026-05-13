const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment, must be 32 bytes (64 hex chars)
 */
function getKey() {
  const key = process.env.QR_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('QR_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a JSON payload using AES-256-GCM
 * @param {object} payload - The data to encrypt
 * @returns {string} - Base64-encoded encrypted string (iv:encrypted:authTag)
 */
function encrypt(payload) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(payload);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:encrypted:authTag (all hex)
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} encryptedData - Format: iv:encrypted:authTag (hex)
 * @returns {object} - Original JSON payload
 */
function decrypt(encryptedData) {
  const key = getKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, encrypted, authTagHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

module.exports = { encrypt, decrypt };
