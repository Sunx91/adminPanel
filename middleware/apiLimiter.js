const rateLimit = require('express-rate-limit');

/** Limit brute-force attempts on JSON API (login). */
const apiLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_LOGIN_MAX_ATTEMPTS) || 30,
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

module.exports = { apiLoginLimiter };
