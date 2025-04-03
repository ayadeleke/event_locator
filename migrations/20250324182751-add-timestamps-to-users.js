'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'createdAt', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    });
    await queryInterface.addColumn('users', 'updatedAt', {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'createdAt');
    await queryInterface.removeColumn('users', 'updatedAt');
  }
};
