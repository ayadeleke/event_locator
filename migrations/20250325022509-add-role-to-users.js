'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      defaultValue: 'user',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING,
      defaultValue: 'user',
    });
  }
};
