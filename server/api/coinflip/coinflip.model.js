'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Coinflip', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    player1: DataTypes.INTEGER,
    player2: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    amount: DataTypes.FLOAT,
    winner: {
      type: DataTypes.ENUM('Player 1', 'Player 2', 'Undecided'),
      defaultValue: 'Undecided'
    },
    player1Side: DataTypes.ENUM('T', 'CT'),
    created: {
      type: DataTypes.DATE(),
      default: DataTypes.NOW()
    },
    accepted: DataTypes.DATE()
  });
}
