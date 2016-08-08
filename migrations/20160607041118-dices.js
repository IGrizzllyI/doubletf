'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable(
        'Rolls',
        {
          _id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
          },
          player: Sequelize.INTEGER,
          amountWagered: Sequelize.FLOAT,
          winNumber: Sequelize.FLOAT,
          isUp: Sequelize.BOOLEAN,
          datePlayed: {
            type: Sequelize.DATE(),
            default: Sequelize.NOW()
          }
        }
      );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Rolls')
  }
};
