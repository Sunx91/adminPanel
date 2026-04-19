// Express middleware: (req, res, next) => { ...; next(); }
// If you forget next(), the browser will wait forever for a response.

function requestLogger(req, res, next) {
  const whenRequestStarted = Date.now();

  // "finish" = the response has been fully sent (we know the status code).
  function logWhenDone() {
    const milliseconds = Date.now() - whenRequestStarted;
    // eslint-disable-next-line no-console
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${milliseconds}ms`);
  }

  res.on('finish', logWhenDone);

  next();
}

module.exports = requestLogger;
