'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Tradeoffer', {
    _id: {
      type: DataTypes.INTEGER
    },
    points: DataTypes.FLOAT,
    steamId: DataTypes.STRING,
    botSteamId: DataTypes.STRING,
    withdraw: DataTypes.BOOLEAN,
    status: DataTypes.INTEGER,
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4(),
      primaryKey: true,
      allowNull: false
    }
  });
}
