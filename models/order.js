const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'pending',
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { tableName: 'orders' }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'orderItems' });
  };

  return Order;
};
