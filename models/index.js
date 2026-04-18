const { sequelize } = require('../config/database');
const defineUser = require('./user');
const defineCategory = require('./category');
const defineProduct = require('./product');
const defineOrder = require('./order');
const defineOrderItem = require('./order-item');
const defineSetting = require('./setting');

const User = defineUser(sequelize);
const Category = defineCategory(sequelize);
const Product = defineProduct(sequelize);
const Order = defineOrder(sequelize);
const OrderItem = defineOrderItem(sequelize);
const Setting = defineSetting(sequelize);

const models = { User, Category, Product, Order, OrderItem, Setting, sequelize };

Object.keys(models).forEach((name) => {
  if (name !== 'sequelize' && models[name].associate) {
    models[name].associate(models);
  }
});

module.exports = models;
