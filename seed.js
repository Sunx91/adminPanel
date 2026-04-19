require('dotenv').config();
const { sequelize, User, Category, Product, Order, OrderItem, Setting } = require('./models');

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function utcDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

async function backdateOrder(orderId, at) {
  await sequelize.query(
    'UPDATE "orders" SET "createdAt" = $1, "updatedAt" = $1 WHERE id = $2',
    { bind: [at, orderId] }
  );
}

async function seed() {
  await sequelize.sync({ force: true });
  // eslint-disable-next-line no-console
  console.log('Tables recreated...');

  await Setting.bulkCreate([
    { key: 'tax_rate', value: '0.08' },
    { key: 'currency', value: 'USD' },
  ]);
  // eslint-disable-next-line no-console
  console.log('Settings seeded...');

  await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  const customerData = [
    { name: 'Sunath Sandul', email: 'sunath@example.com' },
    { name: 'Priya Sharma', email: 'priya@example.com' },
    { name: 'Alex Johnson', email: 'alex@example.com' },
    { name: 'Grace Obi', email: 'grace@example.com' },
    { name: 'Omar Farouq', email: 'omar@example.com' },
    { name: 'Yuki Tanaka', email: 'yuki@example.com' },
    { name: 'Sofia Reyes', email: 'sofia@example.com' },
    { name: 'Liam Chen', email: 'liam@example.com' },
    { name: 'Amara Diallo', email: 'amara@example.com' },
    { name: 'Noah Park', email: 'noah@example.com' },
    { name: 'Isabella Gomez', email: 'isabella@example.com' },
    { name: 'Ethan Williams', email: 'ethan@example.com' },
    { name: 'Fatima Malik', email: 'fatima@example.com' },
    { name: 'Lucas Martins', email: 'lucas@example.com' },
    { name: 'Ava Thompson', email: 'ava@example.com' },
    { name: 'Mohammed Al-Amin', email: 'mohammed@example.com' },
    { name: 'Chloe Dupont', email: 'chloe@example.com' },
    { name: 'Raj Patel', email: 'raj@example.com' },
    { name: 'Zara Ahmed', email: 'zara@example.com' },
    { name: 'James Okafor', email: 'james@example.com' },
    { name: 'Emma Laurent', email: 'emma@example.com' },
    { name: 'Daniel Kim', email: 'daniel@example.com' },
    { name: 'Aisha Nkosi', email: 'aisha@example.com' },
    { name: 'Carlos Mendez', email: 'carlos@example.com' },
    { name: 'Mei Lin', email: 'mei@example.com' },
    { name: 'Tom Bradley', email: 'tom@example.com' },
    { name: 'Sara Johansson', email: 'sara@example.com' },
    { name: 'Kevin Nguyen', email: 'kevin@example.com' },
    { name: 'Nina Petrov', email: 'nina@example.com' },
    { name: 'Ben Osei', email: 'ben@example.com' },
  ];

  const customers = [];
  for (const { name, email } of customerData) {
    const c = await User.create({
      name,
      email,
      password: 'user123',
      role: 'user',
    });
    customers.push(c);
  }
  // eslint-disable-next-line no-console
  console.log(`Users seeded... (1 admin + ${customers.length} customers)`);

  const catElectronics = await Category.create({ name: 'Electronics' });
  const catBooks = await Category.create({ name: 'Books' });
  const catAccessories = await Category.create({ name: 'Accessories' });
  // eslint-disable-next-line no-console
  console.log('Categories seeded...');

  const wirelessMouse = await Product.create({ name: 'Wireless Mouse', price: 29.99, stock: 500, categoryId: catElectronics.id });
  const usbCable = await Product.create({ name: 'USB-C Cable', price: 12.5, stock: 800, categoryId: catElectronics.id });
  const keyboard = await Product.create({ name: 'Mechanical Keyboard', price: 129.0, stock: 200, categoryId: catElectronics.id });
  const webcam = await Product.create({ name: 'Webcam HD 1080p', price: 74.0, stock: 150, categoryId: catElectronics.id });
  const headphones = await Product.create({ name: 'Wireless Headphones', price: 89.99, stock: 300, categoryId: catElectronics.id });
  const nodeBook = await Product.create({ name: 'Node.js Complete Guide', price: 45.0, stock: 100, categoryId: catBooks.id });
  const jsBook = await Product.create({ name: 'JavaScript: The Good Parts', price: 35.0, stock: 120, categoryId: catBooks.id });
  const reactBook = await Product.create({ name: 'Learning React', price: 40.0, stock: 90, categoryId: catBooks.id });
  const sqlBook = await Product.create({ name: 'PostgreSQL: Up & Running', price: 38.0, stock: 75, categoryId: catBooks.id });
  const monitorStand = await Product.create({ name: 'Monitor Stand', price: 62.5, stock: 180, categoryId: catAccessories.id });
  const usbHub = await Product.create({ name: 'USB-C Hub 7-in-1', price: 45.0, stock: 250, categoryId: catAccessories.id });
  const deskPad = await Product.create({ name: 'Large Desk Pad', price: 22.0, stock: 400, categoryId: catAccessories.id });
  const laptopSleeve = await Product.create({ name: 'Laptop Sleeve 15"', price: 18.5, stock: 350, categoryId: catAccessories.id });
  // eslint-disable-next-line no-console
  console.log('Products seeded...');

  async function createOrder(user, status, items, daysAgo) {
    const total = roundMoney(items.reduce((sum, { product, qty }) => sum + Number(product.price) * qty, 0));
    const order = await Order.create({
      userId: user.id,
      status,
      total,
    });

    for (const { product, qty } of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        quantity: qty,
        unitPrice: product.price,
      });

      if (status !== 'cancelled') {
        await Product.decrement('stock', { by: qty, where: { id: product.id } });
      }
    }

    await backdateOrder(order.id, utcDaysAgo(daysAgo));
    return order;
  }

  // Month 12 ago (oldest)
  await createOrder(customers[0], 'paid', [{ product: keyboard, qty: 1 }, { product: usbCable, qty: 2 }], 365);
  await createOrder(customers[1], 'paid', [{ product: wirelessMouse, qty: 1 }], 358);
  await createOrder(customers[2], 'paid', [{ product: nodeBook, qty: 1 }, { product: jsBook, qty: 1 }], 350);
  await createOrder(customers[3], 'paid', [{ product: headphones, qty: 1 }, { product: deskPad, qty: 1 }], 344);

  // Month 10-11 ago
  await createOrder(customers[4], 'paid', [{ product: webcam, qty: 1 }], 330);
  await createOrder(customers[5], 'paid', [{ product: monitorStand, qty: 1 }, { product: usbHub, qty: 1 }], 322);
  await createOrder(customers[6], 'paid', [{ product: reactBook, qty: 2 }], 315);
  await createOrder(customers[7], 'pending', [{ product: laptopSleeve, qty: 1 }], 310);

  // Month 8-9 ago
  await createOrder(customers[8], 'paid', [{ product: keyboard, qty: 1 }], 290);
  await createOrder(customers[9], 'paid', [{ product: usbHub, qty: 2 }, { product: deskPad, qty: 1 }], 282);
  await createOrder(customers[10], 'paid', [{ product: sqlBook, qty: 1 }, { product: nodeBook, qty: 1 }], 275);
  await createOrder(customers[11], 'paid', [{ product: headphones, qty: 1 }, { product: usbCable, qty: 3 }], 268);
  await createOrder(customers[12], 'pending', [{ product: wirelessMouse, qty: 2 }], 262);

  // Month 6-7 ago
  await createOrder(customers[13], 'paid', [{ product: webcam, qty: 1 }, { product: laptopSleeve, qty: 1 }], 245);
  await createOrder(customers[14], 'paid', [{ product: monitorStand, qty: 1 }], 238);
  await createOrder(customers[15], 'paid', [{ product: jsBook, qty: 1 }, { product: reactBook, qty: 1 }, { product: sqlBook, qty: 1 }], 230);
  await createOrder(customers[16], 'paid', [{ product: keyboard, qty: 1 }, { product: deskPad, qty: 2 }], 222);
  await createOrder(customers[17], 'pending', [{ product: usbHub, qty: 1 }], 216);

  // Month 4-5 ago
  await createOrder(customers[18], 'paid', [{ product: headphones, qty: 2 }], 200);
  await createOrder(customers[19], 'paid', [{ product: wirelessMouse, qty: 1 }, { product: usbCable, qty: 1 }], 192);
  await createOrder(customers[20], 'paid', [{ product: nodeBook, qty: 1 }], 185);
  await createOrder(customers[21], 'paid', [{ product: webcam, qty: 1 }, { product: usbHub, qty: 1 }], 178);
  await createOrder(customers[22], 'paid', [{ product: laptopSleeve, qty: 3 }], 172);
  await createOrder(customers[23], 'pending', [{ product: keyboard, qty: 1 }], 166);

  // Month 2-3 ago
  await createOrder(customers[24], 'paid', [{ product: monitorStand, qty: 1 }, { product: deskPad, qty: 1 }], 150);
  await createOrder(customers[25], 'paid', [{ product: sqlBook, qty: 2 }, { product: jsBook, qty: 1 }], 142);
  await createOrder(customers[26], 'paid', [{ product: usbCable, qty: 4 }], 135);
  await createOrder(customers[27], 'paid', [{ product: headphones, qty: 1 }, { product: laptopSleeve, qty: 1 }], 128);
  await createOrder(customers[28], 'paid', [{ product: reactBook, qty: 1 }, { product: nodeBook, qty: 1 }], 120);
  await createOrder(customers[29], 'pending', [{ product: webcam, qty: 1 }], 115);

  // Last month
  await createOrder(customers[0], 'paid', [{ product: usbHub, qty: 1 }, { product: deskPad, qty: 2 }], 95);
  await createOrder(customers[1], 'paid', [{ product: keyboard, qty: 1 }], 88);
  await createOrder(customers[2], 'paid', [{ product: wirelessMouse, qty: 2 }, { product: usbCable, qty: 2 }], 82);
  await createOrder(customers[3], 'paid', [{ product: headphones, qty: 1 }], 75);
  await createOrder(customers[4], 'pending', [{ product: monitorStand, qty: 1 }, { product: laptopSleeve, qty: 2 }], 68);
  await createOrder(customers[5], 'paid', [{ product: sqlBook, qty: 1 }, { product: jsBook, qty: 2 }], 60);

  // Last 2 weeks
  await createOrder(customers[6], 'paid', [{ product: webcam, qty: 1 }, { product: usbHub, qty: 1 }], 13);
  await createOrder(customers[7], 'paid', [{ product: keyboard, qty: 1 }, { product: deskPad, qty: 1 }], 11);
  await createOrder(customers[8], 'pending', [{ product: nodeBook, qty: 2 }], 9);
  await createOrder(customers[9], 'paid', [{ product: laptopSleeve, qty: 2 }, { product: usbCable, qty: 1 }], 7);
  await createOrder(customers[10], 'paid', [{ product: headphones, qty: 1 }, { product: reactBook, qty: 1 }], 5);
  await createOrder(customers[11], 'paid', [{ product: wirelessMouse, qty: 1 }, { product: monitorStand, qty: 1 }], 3);
  await createOrder(customers[12], 'pending', [{ product: usbHub, qty: 2 }], 2);
  await createOrder(customers[13], 'paid', [{ product: keyboard, qty: 1 }, { product: headphones, qty: 1 }], 1);

  const userCount = await User.count();
  const categoryCount = await Category.count();
  const productCount = await Product.count();
  const orderCount = await Order.count();
  const paidCount = await Order.count({ where: { status: 'paid' } });
  const pendingCount = await Order.count({ where: { status: 'pending' } });
  const itemCount = await OrderItem.count();

  // eslint-disable-next-line no-console
  console.log('Orders and order items seeded...');
  // eslint-disable-next-line no-console
  console.log('\nSeed complete!\n');
  // eslint-disable-next-line no-console
  console.log('LOGIN CREDENTIALS');
  // eslint-disable-next-line no-console
  console.log('──────────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log(' Admin  → admin@example.com  / admin123');
  // eslint-disable-next-line no-console
  console.log(' Users  → [name]@example.com / user123');
  // eslint-disable-next-line no-console
  console.log('──────────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log('\nDATA SUMMARY');
  // eslint-disable-next-line no-console
  console.log('──────────────────────────────────────────');
  // eslint-disable-next-line no-console
  console.log(` Users       : ${userCount} (1 admin + ${userCount - 1} customers)`);
  // eslint-disable-next-line no-console
  console.log(` Categories  : ${categoryCount}`);
  // eslint-disable-next-line no-console
  console.log(` Products    : ${productCount}`);
  // eslint-disable-next-line no-console
  console.log(` Orders      : ${orderCount} (${paidCount} paid / ${pendingCount} pending)`);
  // eslint-disable-next-line no-console
  console.log(` Order items : ${itemCount}`);
  // eslint-disable-next-line no-console
  console.log(' Settings    : 2 (tax_rate, currency)');
  // eslint-disable-next-line no-console
  console.log(' Date range  : 365 days ago → today');
  // eslint-disable-next-line no-console
  console.log('──────────────────────────────────────────');
}

seed()
  .then(() => sequelize.close())
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', e);
    process.exit(1);
  });
