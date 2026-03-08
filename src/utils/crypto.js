const crypto = require('crypto');

const algorithm = 'aes-256-gcm';

function getSecret() {
  const raw = process.env.APP_CONFIG_SECRET || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptText(plainText = '') {
  if (!plainText) return '';

  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptText(payload = '') {
  if (!payload) return '';
  const [ivHex, tagHex, encryptedHex] = payload.split(':');
  if (!ivHex || !tagHex || !encryptedHex) return '';

  try {
    const key = getSecret();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    return '';
  }
}

function maskSecret(secret = '', visible = 4) {
  if (!secret) return '';
  if (secret.length <= visible) return '*'.repeat(secret.length);
  return `${'*'.repeat(Math.max(6, secret.length - visible))}${secret.slice(-visible)}`;
}

module.exports = {
  encryptText,
  decryptText,
  maskSecret,
};
