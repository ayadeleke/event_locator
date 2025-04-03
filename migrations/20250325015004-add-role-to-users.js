'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the 'role' column to the 'users' table
    await queryInterface.addColumn('users', 'role', {
      type: String, enum: ["admin", "user"],
      defaultValue: 'user',  // Default value for the role
      allowNull: false,      // Ensure the column cannot be null
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the change (drop the 'role' column)
    await queryInterface.removeColumn('users', 'role');
  }
};
