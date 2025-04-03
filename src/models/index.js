combine this appropriately:
require('dotenv').config(); // Load environment variables
const { Sequelize } = require('sequelize');

// Use local PostgreSQL configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log,  // Optional: Enable logging of SQL queries
});

const User = require('./user'); // Import models
// const Event = require('./events');

// Sync models (use migrations in production)
sequelize.sync() // Sync models (recommended to use migrations in production)

module.exports = { sequelize, User, Event };