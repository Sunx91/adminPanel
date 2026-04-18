require('dotenv').config();

const MIN_SECRET_LENGTH = 32;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validates required env. Call once at process startup.
 * @throws {Error} when configuration is unsafe for the current NODE_ENV
 */
function validateEnv() {
  const jwt = process.env.JWT_SECRET;
  const cookie = process.env.COOKIE_SECRET;

  if (!jwt || !cookie) {
    throw new Error('JWT_SECRET and COOKIE_SECRET must be set');
  }

  if (isProduction()) {
    if (jwt.length < MIN_SECRET_LENGTH || cookie.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `In production, JWT_SECRET and COOKIE_SECRET must each be at least ${MIN_SECRET_LENGTH} characters`
      );
    }
    if (jwt === cookie) {
      throw new Error('In production, JWT_SECRET and COOKIE_SECRET must be different values');
    }
  }

  if (isProduction() && process.env.DB_SYNC === 'true' && process.env.ALLOW_DB_SYNC_IN_PRODUCTION !== 'true') {
    throw new Error(
      'Refusing to start: DB_SYNC=true is not allowed in production unless ALLOW_DB_SYNC_IN_PRODUCTION=true'
    );
  }
}

module.exports = {
  isProduction,
  validateEnv,
  MIN_SECRET_LENGTH,
};
