'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    // USERS TABLE
    queryInterface.createTable(
      'Users',
      {
        _id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        personaname: Sequelize.STRING,
        profilepicture: Sequelize.STRING,
        steamid: Sequelize.STRING,
        diamonds: {
          type: Sequelize.FLOAT,
          defaultValue: 0
        },
        totalBet: {
          type: Sequelize.FLOAT,
          defaultValue: 0
        },
        totalWon: {
          type: Sequelize.FLOAT,
          defaultValue: 0
        },
        tags: Sequelize.STRING,
        banned: Sequelize.DATE,
        amountWithdrawable: Sequelize.FLOAT
      }
    )

    // TRADEOFFERS TABLE
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

    // COINFLIP TABLE
    queryInterface.createTable(
      'Coinflips',
      {
        _id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        player1: Sequelize.INTEGER,
        player2: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        amount: Sequelize.FLOAT,
        winner: {
          type: Sequelize.ENUM('Player 1', 'Player 2', 'Undecided'),
          defaultValue: 'Undecided'
        },
        player1Side: Sequelize.ENUM('T', 'CT'),
        created: {
          type: Sequelize.DATE(),
          default: Sequelize.NOW()
        },
        accepted: Sequelize.DATE()
      }
    )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropAllTables();
  }
};
