const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },  
    },
    {
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password') && user.password) {
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
          }
        },
      },
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
  };

  return User;
};
