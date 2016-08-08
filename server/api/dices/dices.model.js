'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Roll', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    player: DataTypes.INTEGER,
    amountWagered: DataTypes.FLOAT,
    winNumber: DataTypes.FLOAT,
    isUp: DataTypes.BOOLEAN,
    actualNumber: DataTypes.FLOAT,
    datePlayed: {
      type: DataTypes.DATE(),
      default: DataTypes.NOW()
    }
  });
}
