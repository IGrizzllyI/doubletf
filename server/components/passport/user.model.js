'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('User', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    personaname: DataTypes.STRING,
    profilepicture: DataTypes.STRING,
    steamid: DataTypes.STRING,
    diamonds: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalBet: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalWon: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    tags: DataTypes.STRING,
    banned: DataTypes.DATE,
    amountWithdrawable: DataTypes.FLOAT,
    referredBy: DataTypes.STRING
  });
}
