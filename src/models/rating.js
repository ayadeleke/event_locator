const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');
const User = require('./user');
const Event = require('./events');

const Rating = sequelize.define('Rating', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'ratings',
    timestamps: true
});

// Relationships
Rating.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Rating.belongsTo(Event, { foreignKey: 'event_id', onDelete: 'CASCADE' });

module.exports = Rating;
