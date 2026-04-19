require('dotenv').config();
const express = require('express');
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

async function start() {
  await sequelize.authenticate();

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
    console.log(`http://localhost:${PORT}${adminJs.options.rootPath}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
