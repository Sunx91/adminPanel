const crypto = require('crypto');
const { User, Category, Product, Order, OrderItem } = require('../models');

/** RBAC: `role` comes from `User` via `authenticate()` → `currentAdmin`. */
const isAdmin = ({ currentAdmin }) => currentAdmin?.role === 'admin';

/** Admin or store customer — catalog + own orders (never the Users resource). */
const isStoreRole = ({ currentAdmin }) =>
  currentAdmin?.role === 'admin' || currentAdmin?.role === 'user';

/** Inject human-readable lines into Order show (and edit) JSON — Sequelize hasMany is not a listable AdminJS field by default. */
async function orderRecordLineItemsAfter(response) {
  const rid = response.record?.params?.id;
  if (rid == null) return response;

  const items = await OrderItem.findAll({
    where: { orderId: rid },
    include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
    order: [['id', 'ASC']],
  });

  const lines = items.map((row) => {
    const name = row.product ? row.product.name : `Product #${row.productId}`;
    const unit = Number(row.unitPrice);
    const qty = Number(row.quantity);
    const sub = unit * qty;
    return `${name}  × ${qty}  @ $${unit.toFixed(2)}  =  $${sub.toFixed(2)}`;
  });

  response.record.params.lineItemsPreview =
    lines.length > 0 ? lines.join('\n') : 'No line items for this order.';

  return response;
}

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
  const q = { ...(request.query || {}) };
  Object.keys(q).forEach((key) => {
    if (key === 'filters.userId' || key.startsWith('filters.userId.')) {
      delete q[key];
    }
  });
  q['filters.userId'] = context.currentAdmin.id;
  return { ...request, query: q };
};

const orderItemListBefore = async (request, context) => {
  if (context.currentAdmin?.role === 'admin') {
    return request;
  }
  const q = { ...(request.query || {}) };
  Object.keys(q).forEach((key) => {
    if (key === 'filters.orderId' || key.startsWith('filters.orderId.')) {
      delete q[key];
    }
  });
  const orderRows = await Order.findAll({
    where: { userId: context.currentAdmin.id },
    attributes: ['id'],
    raw: true,
  });
  if (orderRows.length === 0) {
    q['filters.orderId'] = '0';
    return { ...request, query: q };
  }
  orderRows.forEach((row, i) => {
    q[`filters.orderId.${i}`] = String(row.id);
  });
  return { ...request, query: q };
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
      name: {
        isTitle: true,
      },
      password: {
        ...passwordHidden,
        type: 'password',
      },
    },
    listProperties: ['id', 'name', 'email', 'role', 'createdAt'],
    showProperties: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    editProperties: ['name', 'email', 'role'],
    newProperties: ['name', 'email', 'role'],
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
      bulkDelete: { isAccessible: isAdmin },
      show: { isAccessible: isAdmin },
      search: { isAccessible: isAdmin },
    },
  },
};

const categoryResource = {
  resource: Category,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'name', 'createdAt'],
    showProperties: ['id', 'name', 'createdAt', 'updatedAt'],
    properties: {
      products: { isVisible: { list: true, show: true } },
    },
    actions: {
      list: { isAccessible: isStoreRole },
      show: { isAccessible: isStoreRole },
      search: { isAccessible: isStoreRole },
      new: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      bulkDelete: { isAccessible: isAdmin },
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
    actions: {
      list: { isAccessible: isStoreRole },
      show: { isAccessible: isStoreRole },
      search: { isAccessible: isStoreRole },
      new: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      bulkDelete: { isAccessible: isAdmin },
    },
  },
};

const orderResource = {
  resource: Order,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'status', 'total', 'userId', 'createdAt'],
    showProperties: [
      'id',
      'status',
      'total',
      'userId',
      'lineItemsPreview',
      'createdAt',
      'updatedAt',
    ],
    properties: {
      status: {
        availableValues: [
          { value: 'pending', label: 'pending' },
          { value: 'paid', label: 'paid' },
          { value: 'cancelled', label: 'cancelled' },
        ],
      },
      // Sequelize adapter only exposes columns; `user` was a virtual field and stayed empty in lists.
      // Point FK at the `users` resource so AdminJS can populate the related record (title = user name).
      userId: {
        reference: 'users',
        label: 'Customer',
      },
      lineItemsPreview: {
        label: 'Included items',
        type: 'textarea',
        isVisible: { list: false, show: true, filter: false, edit: false, new: false },
        description: 'Products in this order (unit price × quantity per line).',
        props: { rows: 12 },
      },
    },
    actions: {
      list: { before: orderListBefore, isAccessible: isStoreRole },
      show: {
        isAccessible: orderOwnedByCurrentUser,
        after: orderRecordLineItemsAfter,
      },
      edit: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      bulkDelete: { isAccessible: isAdmin },
    },
  },
};

const orderItemResource = {
  resource: OrderItem,
  options: {
    navigation: catalogNav,
    listProperties: ['id', 'orderId', 'productId', 'quantity', 'unitPrice'],
    showProperties: ['id', 'orderId', 'productId', 'quantity', 'unitPrice'],
    properties: {
      order: { isVisible: { list: true, show: true, filter: true } },
      product: { isVisible: { list: true, show: true, filter: true } },
    },
    actions: {
      list: { before: orderItemListBefore, isAccessible: isStoreRole },
      search: { isAccessible: isAdmin },
      new: { isAccessible: isAdmin },
      edit: { isAccessible: isAdmin },
      delete: { isAccessible: isAdmin },
      bulkDelete: { isAccessible: isAdmin },
      show: { isAccessible: orderItemShowAccessible },
    },
  },
};

const resources = [
  userResource,
  categoryResource,
  productResource,
  orderResource,
  orderItemResource,
];

module.exports = {
  resources,
  isAdmin,
  isStoreRole,
  passwordHidden,
};
