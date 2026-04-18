require('dotenv').config();
const { sequelize, User, Category, Product, Order, OrderItem, Setting } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });

  await User.create({
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  });

  const user = await User.create({
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
  });

  const catElectronics = await Category.create({ name: 'Electronics', slug: 'electronics' });
  const catBooks = await Category.create({ name: 'Books', slug: 'books' });

  const p1 = await Product.create({
    name: 'Wireless Mouse',
    price: 29.99,
    stock: 40,
    categoryId: catElectronics.id,
  });
  const p2 = await Product.create({
    name: 'USB-C Cable',
    price: 12.5,
    stock: 120,
    categoryId: catElectronics.id,
  });
  const p3 = await Product.create({
    name: 'Node.js Guide',
    price: 45,
    stock: 15,
    categoryId: catBooks.id,
  });

  await Setting.bulkCreate([
    { key: 'site_name', value: 'Demo eCommerce' },
    { key: 'tax_rate', value: '0.08' },
    { key: 'currency', value: 'USD' },
  ]);

  const order1 = await Order.create({
    userId: user.id,
    status: 'paid',
    total: 42.49,
  });
  await OrderItem.create({
    orderId: order1.id,
    productId: p1.id,
    quantity: 1,
    unitPrice: p1.price,
  });
  await OrderItem.create({
    orderId: order1.id,
    productId: p2.id,
    quantity: 1,
    unitPrice: p2.price,
  });

  const order2 = await Order.create({
    userId: user.id,
    status: 'pending',
    total: p3.price,
  });
  await OrderItem.create({
    orderId: order2.id,
    productId: p3.id,
    quantity: 1,
    unitPrice: p3.price,
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  // eslint-disable-next-line no-console
  console.log('Admin: admin@example.com / admin123');
  // eslint-disable-next-line no-console
  console.log('User:  user@example.com / user123');
}

seed()
  .then(() => sequelize.close())
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
