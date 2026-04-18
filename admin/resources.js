const crypto = require('crypto');
const { User, Category, Product, Order, OrderItem, Setting } = require('../models');

const isAdmin = ({ currentAdmin }) => currentAdmin?.role === 'admin';

const passwordHidden = {
  isVisible: {
    list: false,
    show: false,
    filter: false,
    edit: false,
  },
};

const orderOwnedByCurrentUser = async ({ record, currentAdmin }) => {
  if (!record || currentAdmin?.role === 'admin') return true;
  const uid = record.get ? record.get('userId') : record.params?.userId;
  return String(uid) === String(currentAdmin.id);
};

const orderItemShowAccessible = async ({ record, currentAdmin }) => {
  if (!record || currentAdmin?.role === 'admin') return true;
  const orderId = record.get ? record.get('orderId') : record.params?.orderId;
  if (!orderId) return false;
  const order = await Order.findByPk(orderId);
  return order && String(order.userId) === String(currentAdmin.id);
};

const orderListBefore = async (request, context) => {
  if (context.currentAdmin?.role === 'admin') {
    return request;
  }
  const q = request.query || {};
  return {
    ...request,
    query: {
      ...q,
      'filters.userId': context.currentAdmin.id,
    },
  };
};

const catalogNav = {
  name: 'Catalog',
  icon: 'ShoppingCart',
};

const userResource = {
  resource: User,
  options: {
    // Top-level item (no duplicate "Users" folder wrapping "users")
    navigation: {
      name: null,
      icon: 'User',
    },
    properties: {
      password: {
        ...passwordHidden,
        type: 'password',
      },
    },
    listProperties: ['id', 'email', 'role', 'createdAt'],
    showProperties: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
    editProperties: ['email', 'role'],
    newProperties: ['email', 'role'],
    actions: {
      list: { isAccessible: isAdmin },
      new: {
        isAccessible: isAdmin,
        before: async (request) => {
          const payload = { ...(request.payload || {}) };
          if (!payload.password || String(payload.password).trim() === '') {
            payload.password = `init_${crypto.randomBytes(12).toString('hex')}`;
          }
          return { ...request, payload };
        },
      },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      show: { isAccessible: isAdmin },
      search: { isAccessible: isAdmin },
    },
  },
};

const categoryResource = {
  resource: Category,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'name', 'slug', 'createdAt'],
    showProperties: ['id', 'name', 'slug', 'createdAt', 'updatedAt'],
    properties: {
      products: { isVisible: { list: true, show: true } },
    },
  },
};

const productResource = {
  resource: Product,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'name', 'price', 'stock', 'categoryId', 'createdAt'],
    showProperties: ['id', 'name', 'price', 'stock', 'categoryId', 'createdAt', 'updatedAt'],
    properties: {
      category: { isVisible: { list: true, show: true, filter: true } },
    },
  },
};

const orderResource = {
  resource: Order,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'status', 'total', 'userId', 'createdAt'],
    showProperties: ['id', 'status', 'total', 'userId', 'createdAt', 'updatedAt'],
    properties: {
      user: { isVisible: { list: true, show: true } },
      orderItems: { isVisible: { list: false, show: true } },
    },
    actions: {
      list: { before: orderListBefore },
      show: { isAccessible: orderOwnedByCurrentUser },
      edit: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
    },
  },
};

const orderItemResource = {
  resource: OrderItem,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'createdAt'],
    showProperties: ['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'createdAt', 'updatedAt'],
    properties: {
      order: { isVisible: { list: true, show: true, filter: true } },
      product: { isVisible: { list: true, show: true, filter: true } },
    },
    actions: {
      list: { isAccessible: isAdmin },
      search: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      show: { isAccessible: orderItemShowAccessible },
    },
  },
};

const settingResource = {
  resource: Setting,
  options: {
    navigation: {
      name: null,
      icon: 'Settings',
    },
    listProperties: ['id', 'key', 'value', 'updatedAt'],
    showProperties: ['id', 'key', 'value', 'createdAt', 'updatedAt'],
    actions: {
      list: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      show: { isAccessible: isAdmin },
      search: { isAccessible: isAdmin },
    },
  },
};

const resources = [
  userResource,
  categoryResource,
  productResource,
  orderResource,
  orderItemResource,
  settingResource,
];

module.exports = {
  resources,
  isAdmin,
  passwordHidden,
};
