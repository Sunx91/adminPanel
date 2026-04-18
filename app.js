require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { sequelize } = require('./models');
const authRouter = require('./routes/auth');
const authService = require('./services/authService');
const { createAdminJs } = require('./admin/setup');
const { validateEnv, isProduction } = require('./config/env');
const { apiLoginLimiter } = require('./middleware/apiLimiter');

AdminJS.registerAdapter({
  Database: AdminJSSequelize.Database,
  Resource: AdminJSSequelize.Resource,
});

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// AdminJS serves its own UI assets; full CSP breaks the panel. Disable CSP, keep other sensible defaults.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', express.json({ limit: '32kb' }));
app.use('/api/login', apiLoginLimiter);
app.use('/api', authRouter);

async function start() {
  validateEnv();

  await sequelize.authenticate();

  const allowSync =
    process.env.DB_SYNC === 'true' &&
    (!isProduction() || process.env.ALLOW_DB_SYNC_IN_PRODUCTION === 'true');
  if (allowSync) {
    await sequelize.sync({ alter: true });
  }

  const adminJs = createAdminJs();

  const sessionCookieSecure =
    process.env.SESSION_COOKIE_SECURE === 'true' ||
    (isProduction() && process.env.SESSION_COOKIE_SECURE !== 'false');

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: authService.authenticateAdminPanel,
      cookieName: 'adminjs',
      cookiePassword: process.env.COOKIE_SECRET,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: process.env.COOKIE_SECRET,
      cookie: {
        httpOnly: true,
        secure: sessionCookieSecure,
        sameSite: 'lax',
        maxAge: Number(process.env.SESSION_MAX_AGE_MS) || 1000 * 60 * 60 * 8,
      },
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);

  app.get('/', (_req, res) => {
    res.redirect(adminJs.options.rootPath);
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    if (res.headersSent) {
      return;
    }
    const status = err.statusCode || err.status || 500;
    const body = isProduction() ? { error: 'Internal server error' } : { error: err.message, stack: err.stack };
    res.status(status).json(body);
  });

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    // eslint-disable-next-line no-console
    console.log(`AdminJS: ${adminJs.options.rootPath}`);
  });

  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`${signal} received, closing...`);
    server.close(() => {
      sequelize.close().finally(() => process.exit(0));
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
