'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Tradeoffers').then(() => {
      queryInterface.createTable(
        'Tradeoffers',
        {
          _id: Sequelize.INTEGER,
          uuid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4(),
            primaryKey: true,
            allowNull: false
          },
          points: Sequelize.FLOAT,
          steamId: Sequelize.STRING,
          botSteamId: Sequelize.STRING,
          withdraw: Sequelize.BOOLEAN,
          status: Sequelize.INTEGER
        }
      )
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Tradeoffers').then(() => {
      queryInterface.createTable(
        'Tradeoffers',
        {
          _id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true
          },
          points: Sequelize.FLOAT,
          steamId: Sequelize.STRING,
          botSteamId: Sequelize.STRING,
          withdraw: Sequelize.BOOLEAN,
          status: Sequelize.STRING
        }
      )
    });
  }
};
