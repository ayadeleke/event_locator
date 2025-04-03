const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const Category = require('./category');
const User = require('./user');

const Event = sequelize.define('Event', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    event_time: {
        type: DataTypes.DATE,
        allowNull: false
    },
    location: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false
    }
}, {
    tableName: 'events',
    timestamps: false
});

// Relationships
Event.belongsTo(Category, { foreignKey: 'category_id', onDelete: 'CASCADE' });
Event.belongsTo(User, { foreignKey: 'created_by', onDelete: 'CASCADE' });

module.exports = Event;
