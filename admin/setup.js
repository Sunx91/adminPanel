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

const PAID_STATUS = 'paid';
const LOW_STOCK_MAX = 10;
const SETTINGS_KEYS = {
  taxRate: 'tax_rate',
  currency: 'currency',
};

async function loadTaxRateSetting() {
  const { Setting } = models;
  const row = await Setting.findOne({ where: { key: SETTINGS_KEYS.taxRate }, raw: true });
  const value = Number(String(row?.value ?? '').trim());
  return Number.isFinite(value) ? value : 0;
}

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function monthKeyUTC(isoDate) {
  const d = new Date(isoDate);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function buildLast12MonthKeys() {
  const now = new Date();
  const keys = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

async function dashboardHandler(request, response, context) {
  const { currentAdmin } = context;
  if (!currentAdmin) return {};

  if (currentAdmin.role === 'admin') {
    const { User, Order, Product, Category } = models;

    const monthKeys = buildLast12MonthKeys();
    const rangeStart = new Date(`${monthKeys[0]}-01T00:00:00.000Z`);

    const [
      userCount,
      orderCount,
      productCount,
      categoryCount,
      paidOrders,
      paidRevenueRaw,
      lowStockProducts,
      recentOrderRows,
      paidChartRows,
      taxRate,
    ] = await Promise.all([
      User.count(),
      Order.count(),
      Product.count(),
      Category.count(),
      Order.count({ where: { status: PAID_STATUS } }),
      Order.sum('total', { where: { status: PAID_STATUS } }),
      Product.count({ where: { stock: { [Op.lte]: LOW_STOCK_MAX } } }),
      Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'status', 'total', 'createdAt'],
        include: [{ model: User, as: 'user', attributes: ['email', 'name'] }],
      }),
      Order.findAll({
        where: { status: PAID_STATUS, createdAt: { [Op.gte]: rangeStart } },
        attributes: ['total', 'createdAt'],
        raw: true,
      }),
      loadTaxRateSetting(),
    ]);

    const revenueByMonth = Object.fromEntries(monthKeys.map((k) => [k, 0]));
    for (const row of paidChartRows) {
      const key = monthKeyUTC(row.createdAt);
      if (Object.prototype.hasOwnProperty.call(revenueByMonth, key)) {
        revenueByMonth[key] += Number(row.total);
      }
    }

    const incomeByMonth = monthKeys.map((key) => ({
      key,
      label: formatMonthLabel(key),
      revenue: roundMoney(revenueByMonth[key] || 0),
    }));

    const recentOrders = recentOrderRows.map((row) => ({
      id: row.id,
      status: row.status,
      total: Number(row.total),
      createdAt: row.createdAt,
      customerName: row.user ? row.user.name || '' : '',
      customerEmail: row.user ? row.user.email : '',
    }));
    const paidRevenue = Number(paidRevenueRaw || 0);
    const paidTax = roundMoney(paidRevenue * taxRate);

    return {
      role: 'admin',
      stats: {
        userCount,
        orderCount,
        productCount,
        categoryCount,
        paidOrders,
        paidRevenue,
        paidTax,
        lowStockProducts,
        lowStockThreshold: LOW_STOCK_MAX,
      },
      incomeByMonth,
      recentOrders,
    };
  }

  const userId = currentAdmin.id;
  const { Order, OrderItem, Product, User } = models;

  const profileUser = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role'],
    raw: true,
  });

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
      name: profileUser?.name || '',
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
    const taxRateValue = String(payload.tax_rate ?? '').trim();
    const currencyValue = String(payload.currency ?? '').trim().toUpperCase();

    if (taxRateValue === '' || Number.isNaN(Number(taxRateValue))) {
      return { ok: false, error: 'tax_rate must be a valid number' };
    }

    if (!currencyValue) {
      return { ok: false, error: 'currency is required' };
    }

    await Promise.all([
      Setting.upsert({ key: SETTINGS_KEYS.taxRate, value: taxRateValue }),
      Setting.upsert({ key: SETTINGS_KEYS.currency, value: currencyValue }),
    ]);
  }

  await Setting.destroy({ where: { key: { [Op.in]: ['site_name', 'support_email'] } } });

  const rows = await Setting.findAll({
    where: { key: { [Op.in]: [SETTINGS_KEYS.taxRate, SETTINGS_KEYS.currency] } },
    raw: true,
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    ok: true,
    settings: {
      tax_rate: map[SETTINGS_KEYS.taxRate] ?? '0.08',
      currency: map[SETTINGS_KEYS.currency] ?? 'USD',
      site_name: process.env.SITE_NAME || 'Demo eCommerce',
      support_email: process.env.SUPPORT_EMAIL || 'support@example.com',
    },
  };
}

function createAdminJs() {
  return new AdminJS({
    componentLoader,
    databases: [],
    resources,
    rootPath: '/admin',
    branding: {
      companyName: process.env.SITE_NAME || 'eCommerce Admin',
    },
    dashboard: {
      component: DashboardComponent,
      handler: dashboardHandler,
    },
    pages: {
      Settings: {
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
