/**
 * Logs each HTTP request when the response finishes (method, path, status, time).
 */
function requestLogger(req, res, next) {
  const started = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - started;
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

module.exports = requestLogger;
