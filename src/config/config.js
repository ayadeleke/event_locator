require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('event_locator', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: 'localhost',
  dialect: 'postgres',
  port: 5432,
  logging: false,
});

module.exports = sequelize;
