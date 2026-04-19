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

/** Treat these order statuses as completed for revenue + completed counts */
const COMPLETED_STATUSES = ['paid', 'shipped'];
/** Products at or below this stock level count as low stock */
const LOW_STOCK_MAX = 10;

async function dashboardHandler(request, response, context) {
  const { currentAdmin } = context;
  if (!currentAdmin) {
    return {};
  }

  if (currentAdmin.role === 'admin') {
    const { User, Order, Product, Category } = models;

    const [
      userCount,
      orderCount,
      productCount,
      categoryCount,
      pendingOrders,
      completedOrders,
      revenueRaw,
      lowStockProducts,
      recentOrderRows,
    ] = await Promise.all([
      User.count(),
      Order.count(),
      Product.count(),
      Category.count(),
      Order.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: { [Op.in]: COMPLETED_STATUSES } } }),
      Order.sum('total', { where: { status: { [Op.in]: COMPLETED_STATUSES } } }),
      Product.count({ where: { stock: { [Op.lte]: LOW_STOCK_MAX } } }),
      Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'status', 'total', 'createdAt'],
        include: [{ model: User, as: 'user', attributes: ['email'] }],
      }),
    ]);

    const recentOrders = recentOrderRows.map((row) => ({
      id: row.id,
      status: row.status,
      total: Number(row.total),
      createdAt: row.createdAt,
      customerEmail: row.user ? row.user.email : '',
    }));

    return {
      role: 'admin',
      stats: {
        userCount,
        orderCount,
        productCount,
        categoryCount,
        pendingOrders,
        completedOrders,
        totalRevenue: Number(revenueRaw || 0),
        lowStockProducts,
        lowStockThreshold: LOW_STOCK_MAX,
      },
      recentOrders,
    };
  }

  const userId = currentAdmin.id;
  const { Order, OrderItem, Product } = models;

  const [recentOrders, itemRows] = await Promise.all([
    Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'status', 'total', 'createdAt'],
      raw: true,
    }),
    OrderItem.findAll({
      attributes: ['id', 'orderId', 'productId', 'quantity', 'unitPrice'],
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          where: { userId },
          attributes: ['id', 'status'],
        },
        {
          model: Product,
          as: 'product',
          required: true,
          attributes: ['name'],
        },
      ],
      order: [['id', 'DESC']],
      limit: 12,
    }),
  ]);

  const recentOrderItems = itemRows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    quantity: row.quantity,
    unitPrice: Number(row.unitPrice),
    productName: row.product ? row.product.name : '',
    orderStatus: row.order ? row.order.status : '',
  }));

  return {
    role: 'user',
    profile: {
      id: currentAdmin.id,
      email: currentAdmin.email,
      role: currentAdmin.role,
    },
    recentOrders,
    recentOrderItems,
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
