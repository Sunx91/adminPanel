const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Check login. Same idea as AdminJS: find user by email, compare password with bcrypt.
 * @returns {{ ok: true, user } | { ok: false, code: string, message: string }}
 */
async function verifyCredentials(email, password) {
  const e = String(email ?? '').trim();
  const p = password;

  if (!e || !p) {
    return { ok: false, code: 'VALIDATION_ERROR', message: 'Email and password are required' };
  }

  const user = await User.findOne({ where: { email: e } });
  if (!user) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  const match = await bcrypt.compare(String(p), user.password);
  if (!match) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' };
  }

  return { ok: true, user };
}

function toPublicUser(user) {
  return { id: user.id, name: user.name || '', email: user.email, role: user.role };
}

function issueAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  verifyCredentials,
  toPublicUser,
  issueAccessToken,
  verifyAccessToken,
};
