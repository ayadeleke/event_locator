const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    preferred_language: { type: DataTypes.STRING, defaultValue: 'en' },
    location: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user',
    },
}, {
    tableName: 'users',
    hooks: {
        beforeCreate: (user, options) => {
            if (user.role) {
                user.role = user.role.toLowerCase(); // Normalize to lowercase
            }
        },
        beforeUpdate: (user, options) => {
            if (user.role) {
                user.role = user.role.toLowerCase(); // Normalize to lowercase
            }
        }
    }
});
module.exports = User;
