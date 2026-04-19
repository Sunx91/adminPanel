require('dotenv').config();
const { sequelize, User, Category, Product, Order, OrderItem, Setting } = require('./models');

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Decrement stock for fulfilled lines only (skip cancelled orders).
 */
async function applyStockDecrements(pairs) {
  const byProduct = new Map();
  for (const { productId, quantity } of pairs) {
    byProduct.set(productId, (byProduct.get(productId) || 0) + quantity);
  }
  await Promise.all(
    [...byProduct.entries()].map(([id, qty]) =>
      Product.decrement('stock', { by: qty, where: { id } })
    )
  );
}

async function seed() {
  await sequelize.sync({ force: true });
  // eslint-disable-next-line no-console
  console.log('Tables recreated…');

  await User.create({
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  const customer1 = await User.create({
    email: 'sunath@example.com',
    password: 'user123',
    role: 'user',
  });

  const customer2 = await User.create({
    email: 'priya@example.com',
    password: 'user123',
    role: 'user',
  });

  const customer3 = await User.create({
    email: 'alex@example.com',
    password: 'user123',
    role: 'user',
  });

  // eslint-disable-next-line no-console
  console.log('Users seeded…');

  const catElectronics = await Category.create({ name: 'Electronics' });
  const catBooks = await Category.create({ name: 'Books' });
  const catAccessories = await Category.create({ name: 'Accessories' });

  // eslint-disable-next-line no-console
  console.log('Categories seeded…');

  const wirelessMouse = await Product.create({
    name: 'Wireless Mouse',
    price: 29.99,
    stock: 40,
    categoryId: catElectronics.id,
  });

  const usbCable = await Product.create({
    name: 'USB-C Cable',
    price: 12.5,
    stock: 120,
    categoryId: catElectronics.id,
  });

  const keyboard = await Product.create({
    name: 'Mechanical Keyboard',
    price: 129.0,
    stock: 25,
    categoryId: catElectronics.id,
  });

  const webcam = await Product.create({
    name: 'Webcam HD 1080p',
    price: 74.0,
    stock: 30,
    categoryId: catElectronics.id,
  });

  const nodeBook = await Product.create({
    name: 'Node.js Complete Guide',
    price: 45.0,
    stock: 15,
    categoryId: catBooks.id,
  });

  const jsBook = await Product.create({
    name: 'JavaScript: The Good Parts',
    price: 35.0,
    stock: 20,
    categoryId: catBooks.id,
  });

  const monitorStand = await Product.create({
    name: 'Monitor Stand',
    price: 62.5,
    stock: 18,
    categoryId: catAccessories.id,
  });

  const usbHub = await Product.create({
    name: 'USB-C Hub 7-in-1',
    price: 45.0,
    stock: 50,
    categoryId: catAccessories.id,
  });

  // eslint-disable-next-line no-console
  console.log('Products seeded…');

  await Setting.bulkCreate([
    { key: 'site_name', value: 'Demo eCommerce' },
    { key: 'tax_rate', value: '0.08' },
    { key: 'currency', value: 'USD' },
    { key: 'support_email', value: 'support@example.com' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'max_order_items', value: '20' },
  ]);

  // eslint-disable-next-line no-console
  console.log('Settings seeded…');

  const stockPairs = [];

  // Order 1 — customer1, delivered → completed
  const order1Total = roundMoney(Number(wirelessMouse.price));
  const order1 = await Order.create({
    userId: customer1.id,
    status: 'completed',
    total: order1Total,
  });
  await OrderItem.create({
    orderId: order1.id,
    productId: wirelessMouse.id,
    quantity: 1,
    unitPrice: wirelessMouse.price,
  });
  stockPairs.push({ productId: wirelessMouse.id, quantity: 1 });

  // Order 2 — customer1, processing → paid (fulfillment in progress)
  const order2Total = roundMoney(Number(keyboard.price) + Number(usbCable.price));
  const order2 = await Order.create({
    userId: customer1.id,
    status: 'paid',
    total: order2Total,
  });
  await OrderItem.create({
    orderId: order2.id,
    productId: keyboard.id,
    quantity: 1,
    unitPrice: keyboard.price,
  });
  await OrderItem.create({
    orderId: order2.id,
    productId: usbCable.id,
    quantity: 1,
    unitPrice: usbCable.price,
  });
  stockPairs.push(
    { productId: keyboard.id, quantity: 1 },
    { productId: usbCable.id, quantity: 1 }
  );

  // Order 3 — customer2, shipped (subtotal: 74 + 62.5 + 12.5*2 = 161.5)
  const order3Subtotal = roundMoney(
    Number(webcam.price) + Number(monitorStand.price) + Number(usbCable.price) * 2
  );
  const order3 = await Order.create({
    userId: customer2.id,
    status: 'shipped',
    total: order3Subtotal,
  });
  await OrderItem.create({
    orderId: order3.id,
    productId: webcam.id,
    quantity: 1,
    unitPrice: webcam.price,
  });
  await OrderItem.create({
    orderId: order3.id,
    productId: monitorStand.id,
    quantity: 1,
    unitPrice: monitorStand.price,
  });
  await OrderItem.create({
    orderId: order3.id,
    productId: usbCable.id,
    quantity: 2,
    unitPrice: usbCable.price,
  });
  stockPairs.push(
    { productId: webcam.id, quantity: 1 },
    { productId: monitorStand.id, quantity: 1 },
    { productId: usbCable.id, quantity: 2 }
  );

  // Order 4 — customer2, pending
  const order4 = await Order.create({
    userId: customer2.id,
    status: 'pending',
    total: roundMoney(Number(nodeBook.price)),
  });
  await OrderItem.create({
    orderId: order4.id,
    productId: nodeBook.id,
    quantity: 1,
    unitPrice: nodeBook.price,
  });
  stockPairs.push({ productId: nodeBook.id, quantity: 1 });

  // Order 5 — customer3, delivered → completed
  const order5Total = roundMoney(Number(jsBook.price) * 2 + Number(usbHub.price));
  const order5 = await Order.create({
    userId: customer3.id,
    status: 'completed',
    total: order5Total,
  });
  await OrderItem.create({
    orderId: order5.id,
    productId: jsBook.id,
    quantity: 2,
    unitPrice: jsBook.price,
  });
  await OrderItem.create({
    orderId: order5.id,
    productId: usbHub.id,
    quantity: 1,
    unitPrice: usbHub.price,
  });
  stockPairs.push(
    { productId: jsBook.id, quantity: 2 },
    { productId: usbHub.id, quantity: 1 }
  );

  // Order 6 — customer3, cancelled (no stock decrement)
  const order6 = await Order.create({
    userId: customer3.id,
    status: 'cancelled',
    total: roundMoney(Number(keyboard.price)),
  });
  await OrderItem.create({
    orderId: order6.id,
    productId: keyboard.id,
    quantity: 1,
    unitPrice: keyboard.price,
  });

  await applyStockDecrements(stockPairs);

  // eslint-disable-next-line no-console
  console.log('Orders and order items seeded (stock adjusted for non-cancelled orders)…');

  // eslint-disable-next-line no-console
  console.log('\nSeed complete.\n');
  // eslint-disable-next-line no-console
  console.log('LOGIN');
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log(' Admin     →  admin@example.com   / admin123');
  // eslint-disable-next-line no-console
  console.log(' Customer  →  sunath@example.com / user123');
  // eslint-disable-next-line no-console
  console.log(' Customer  →  priya@example.com  / user123');
  // eslint-disable-next-line no-console
  console.log(' Customer  →  alex@example.com   / user123');
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log('\nDATA SUMMARY');
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log(' Users       : 4 (1 admin, 3 customers)');
  // eslint-disable-next-line no-console
  console.log(' Categories  : 3');
  // eslint-disable-next-line no-console
  console.log(' Products    : 8');
  // eslint-disable-next-line no-console
  console.log(' Orders      : 6');
  // eslint-disable-next-line no-console
  console.log(' Order items : 10');
  // eslint-disable-next-line no-console
  console.log(' Settings    : 6');
  // eslint-disable-next-line no-console
  console.log('─────────────────────────────────────');
}

seed()
  .then(() => sequelize.close())
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', e);
    process.exit(1);
  });
