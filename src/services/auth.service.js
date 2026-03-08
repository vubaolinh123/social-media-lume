const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user.model');

function normalizeUsername(username = '') {
  return String(username).trim().toLowerCase();
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

async function authenticateUser(username, password) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername || !password) return null;

  const user = await User.findOne({ username: normalizedUsername });
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return user;
}

function signAccessToken(user) {
  const payload = {
    sub: String(user._id),
    username: user.username,
    role: user.role || 'admin',
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.auth.jwtSecret);
}

module.exports = {
  normalizeUsername,
  hashPassword,
  verifyPassword,
  authenticateUser,
  signAccessToken,
  verifyAccessToken,
};
