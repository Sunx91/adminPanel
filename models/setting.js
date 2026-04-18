const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Setting = sequelize.define(
    'Setting',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
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
    {
      tableName: 'settings',
      timestamps: true,
    }
  );

  Setting.associate = () => {};

  return Setting;
};
