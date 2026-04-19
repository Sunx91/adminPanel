const authService = require('../services/authService');

/**
 * Requires `Authorization: Bearer <token>`. Sets `req.auth` to JWT payload.
 */
function requireJwt(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authorization Bearer token is required' },
    });
  }
  const token = header.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authorization Bearer token is required' },
    });
  }
  try {
    req.auth = authService.verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
}

module.exports = { requireJwt };
