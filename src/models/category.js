const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'categories',
    timestamps: false
});

module.exports = Category;
