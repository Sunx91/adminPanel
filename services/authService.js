const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { fn, col, where } = require('sequelize');
const { User } = require('../models');

const JWT_ISSUER = 'adminjs-ecom';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function isValidEmailFormat(email) {
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Verify email + password against the database (case-insensitive email).
 * @returns {Promise<{ ok: true, user: import('sequelize').Model } | { ok: false, code: string }>}
 */
async function verifyCredentials(rawEmail, rawPassword) {
  const email = normalizeEmail(rawEmail);
  const password = rawPassword;

  if (!email || !password) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'Email and password are required' };
  }
  if (!isValidEmailFormat(email)) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'Invalid email format' };
  }

  const user = await User.findOne({
    where: where(fn('LOWER', col('email')), email),
  });

  if (!user) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  const match = await bcrypt.compare(String(password), user.password);
  if (!match) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  return { ok: true, user };
}

function toSessionUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

function issueAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_ISSUER,
  });
}

/**
 * AdminJS session callback — same rules as API login.
 */
async function authenticateAdminPanel(email, password) {
  const result = await verifyCredentials(email, password);
  if (!result.ok) {
    return null;
  }
  return toSessionUser(result.user);
}

module.exports = {
  verifyCredentials,
  authenticateAdminPanel,
  toPublicUser,
  toSessionUser,
  issueAccessToken,
  verifyAccessToken,
  normalizeEmail,
  JWT_ISSUER,
};
