const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define(
    'Setting',
    {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    { tableName: 'settings' }
  );

  Setting.associate = () => {};

  return Setting;
};
