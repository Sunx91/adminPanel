require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const bcrypt = require('bcrypt');
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { sequelize, User } = require('./models');
const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const requestLogger = require('./middleware/requestLogger');
const { createAdminJs } = require('./admin/setup');

AdminJS.registerAdapter({
  Database: AdminJSSequelize.Database,
  Resource: AdminJSSequelize.Resource,
});

if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
  throw new Error('Create a .env file with JWT_SECRET and COOKIE_SECRET (see .env.example)');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(requestLogger);

app.use('/api', healthRouter);
app.use('/api', express.json());
app.use('/api', authRouter);

const openApiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'E-commerce Admin API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  })
);

async function start() {
  await sequelize.authenticate();
  // eslint-disable-next-line no-console
  console.log('[OK] Database connected (PostgreSQL).');

  if (process.env.DB_SYNC === 'true') {
    await sequelize.sync({ alter: true });
  }

  const adminJs = createAdminJs();

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({ where: { email: String(email).trim() } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
      cookieName: 'adminjs',
      cookiePassword: process.env.COOKIE_SECRET,
    },
    null,
    {
      secret: process.env.COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);

  app.get('/', (_req, res) => {
    res.redirect(adminJs.options.rootPath);
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[OK] Server running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`     AdminJS: http://localhost:${PORT}${adminJs.options.rootPath}`);
    // eslint-disable-next-line no-console
    console.log(`     API docs (OpenAPI): http://localhost:${PORT}/api/docs`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
