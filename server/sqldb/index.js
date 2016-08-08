/**
 * Sequelize initialization module
 */

'use strict';

import path from 'path';
import config from '../config/environment';
import Sequelize from 'sequelize';

var db = {
  Sequelize,
  sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};

// Insert models below
db.Tradeoffer = db.sequelize.import('../api/tradeoffer/tradeoffer.model');
db.Coinflip = db.sequelize.import('../api/coinflip/coinflip.model');
db.User = db.sequelize.import('../components/passport/user.model');
db.Roll = db.sequelize.import('../api/dices/dices.model');
db.Association = db.sequelize.import('../components/passport/association.model')

export default db;
