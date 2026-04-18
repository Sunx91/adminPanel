const path = require('path');
const AdminJS = require('adminjs');
const { ComponentLoader } = require('adminjs');
const { ForbiddenError } = require('adminjs/lib/backend/utils/errors/forbidden-error');
const { Op } = require('sequelize');
const { resources } = require('./resources');
const models = require('../models');

const componentLoader = new ComponentLoader();

const DashboardComponent = componentLoader.add('EcomDashboard', path.join(__dirname, 'dashboard.jsx'));
const SettingsPageComponent = componentLoader.add('EcomSettingsPage', path.join(__dirname, 'settings.jsx'));

async function dashboardHandler(request, response, context) {
  const { currentAdmin } = context;
  if (!currentAdmin) {
    return {};
  }

  if (currentAdmin.role === 'admin') {
    const { User, Order, Product, Category } = models;
    const [userCount, orderCount, productCount, categoryCount, revenueRaw] = await Promise.all([
      User.count(),
      Order.count(),
      Product.count(),
      Category.count(),
      Order.sum('total', {
        where: { status: { [Op.in]: ['paid', 'shipped'] } },
      }),
    ]);

    return {
      role: 'admin',
      stats: {
        userCount,
        orderCount,
        productCount,
        categoryCount,
        revenue: Number(revenueRaw || 0),
      },
    };
  }

  const recentOrders = await models.Order.findAll({
    where: { userId: currentAdmin.id },
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'status', 'total', 'createdAt'],
    raw: true,
  });

  return {
    role: 'user',
    profile: {
      id: currentAdmin.id,
      email: currentAdmin.email,
      role: currentAdmin.role,
    },
    recentOrders,
  };
}

async function settingsPageHandler(request, response, context) {
  const { currentAdmin } = context;
  if (!currentAdmin || currentAdmin.role !== 'admin') {
    throw new ForbiddenError('Only administrators can manage settings.');
  }

  const { Setting } = models;
  const method = (request.method && String(request.method).toLowerCase()) || 'get';

  if (method === 'post') {
    const payload = request.payload || {};
    const { id, key, value } = payload;

    if (id) {
      const row = await Setting.findByPk(id);
      if (!row) {
        return { ok: false, error: 'Setting not found' };
      }
      await row.update({
        value: value !== undefined ? String(value) : row.value,
        ...(key !== undefined ? { key: String(key).trim() } : {}),
      });
    } else if (key) {
      const k = String(key).trim();
      const [row, created] = await Setting.findOrCreate({
        where: { key: k },
        defaults: { value: value !== undefined ? String(value) : '' },
      });
      if (!created && value !== undefined) {
        await row.update({ value: String(value) });
      }
    }

    const settings = await Setting.findAll({ order: [['key', 'ASC']] });
    return {
      ok: true,
      settings: settings.map((s) => ({ id: s.id, key: s.key, value: s.value })),
    };
  }

  const settings = await Setting.findAll({ order: [['key', 'ASC']] });
  return {
    settings: settings.map((s) => ({ id: s.id, key: s.key, value: s.value })),
  };
}

function createAdminJs() {
  return new AdminJS({
    componentLoader,
    databases: [models],
    resources,
    rootPath: '/admin',
    branding: {
      companyName: 'eCommerce Admin',
    },
    dashboard: {
      component: DashboardComponent,
      handler: dashboardHandler,
    },
    pages: {
      SiteConfiguration: {
        component: SettingsPageComponent,
        icon: 'Settings',
        handler: settingsPageHandler,
      },
    },
  });
}

module.exports = {
  createAdminJs,
  componentLoader,
};
