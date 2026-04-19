const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Category = sequelize.define(
    'Category',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { tableName: 'categories' }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' });
  };

  return Category;
};
