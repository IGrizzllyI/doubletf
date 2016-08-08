'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Association', {
    handle: DataTypes.STRING,
    provider: DataTypes.STRING,
    algorithm: DataTypes.STRING,
    secret: DataTypes.STRING,
    expires: DataTypes.DATE
  });
}
