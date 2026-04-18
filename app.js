require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const AdminJS = require('adminjs');
const AdminJSExpress = require('@adminjs/express');
const AdminJSSequelize = require('@adminjs/sequelize');
const { sequelize, User } = require('./models');
const authRouter = require('./routes/auth');
const { createAdminJs } = require('./admin/setup');

AdminJS.registerAdapter({
  Database: AdminJSSequelize.Database,
  Resource: AdminJSSequelize.Resource,
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/api', express.json(), authRouter);

async function start() {
  if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
    throw new Error('JWT_SECRET and COOKIE_SECRET must be set in environment');
  }

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
        if (!user) {
          return null;
        }
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          return null;
        }
        return { id: user.id, email: user.email, role: user.role };
      },
      cookieName: 'adminjs',
      cookiePassword: process.env.COOKIE_SECRET,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: process.env.COOKIE_SECRET,
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);

  app.get('/', (_req, res) => {
    res.redirect(adminJs.options.rootPath);
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`AdminJS: http://localhost:${PORT}${adminJs.options.rootPath}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
