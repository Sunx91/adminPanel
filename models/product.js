const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    { tableName: 'products' }
  );

  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Product.hasMany(models.OrderItem, { foreignKey: 'productId', as: 'orderItems' });
  };

  return Product;
};
