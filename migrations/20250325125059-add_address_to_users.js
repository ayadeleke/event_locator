'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.STRING,
      allowNull: true, // Optional, can be NULL
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'address');
  }
};
