const authService = require('../services/authService');

// Express middleware: runs before your route. Call next() only if the user is allowed in.

function requireJwt(req, res, next) {
  // Example header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
  const headerValue = req.headers.authorization;

  if (headerValue === undefined || headerValue === '') {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Missing Authorization header' },
    });
  }

  const parts = headerValue.split(' ');
  const wordBearer = parts[0];
  const tokenString = parts[1];

  const looksLikeBearerToken = parts.length === 2 && wordBearer === 'Bearer' && tokenString;

  if (!looksLikeBearerToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Use: Authorization: Bearer <token>' },
    });
  }

  try {
    const decodedPayload = authService.verifyAccessToken(tokenString);
    req.auth = decodedPayload;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    });
  }
}

module.exports = { requireJwt };
