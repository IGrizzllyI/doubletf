/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/coinflips              ->  index
 * POST    /api/coinflips              ->  create
 * GET     /api/coinflips/:id          ->  show
 * POST     /api/coinflips/:id/accept  ->  accept
 */
'use strict';

import _ from 'lodash';
var User = require('../../sqldb').User;
var Roll = require('../../sqldb').Roll;
var sequelize = require('../../sqldb').sequelize;

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(updated => {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function parseOutput() {
  return function(coinflips) {
    var coinflipsNew = coinflips.map(function(coinflip) {
      coinflip.dataValues.active = coinflip.winner !== "Undecided";
      coinflip.dataValues.joinable = coinflip.player2 === "0";
      return coinflip;
    }).filter((coinflip) => {
      return !coinflip.dataValues.active || coinflip.dataValues.accepted.getTime() + 10000 > Date.now();
    });
    return coinflipsNew;
  }
}

function findUser(userId) {
  return new Promise(function(resolve, reject) {
    User.find({
        where: {
          _id: userId
        }
      })
      .then(function(user) {
        if (user) {
          resolve(user.dataValues);
        } else {
          reject("Couldn't find user " + userId + "!")
        }

      })
      .catch(reject);
  })
}

export function roll(req, res) {
  if(!req.user
    || !req.body.amount
    || isNaN(req.body.amount)
    || !req.body.chance
    || isNaN(req.body.chance)
    || req.body.chance > 94.99
    || req.body.chance < 0.1
    || typeof req.body.isUp !== 'boolean') {
      res.status(400);
      return;
    }
  // console.log(req.user);
  User.findOne({
    where: {
      _id: req.user._id
    }
  }).then(function(user) {
    if(user.diamonds < req.body.amount) {
      req.app.notifyClient(user._id, 'notify', {
        message: "Not enough credits!",
        level: 'error'
      });
      res.send(403);
      return;
    }

    user.diamonds -= req.body.amount;
    if(user.get('amountWithdrawable') + Number(req.body.amount) >= user.get('diamonds')) {
      user.set('amountWithdrawable', user.get('diamonds'));
    } else {
      user.set('amountWithdrawable', user.get('amountWithdrawable') + Number(req.body.amount));
    }
    user.save();

    Roll.create({
      player: req.user._id,
      amountWagered: req.body.amount,
      winNumber: req.body.chance,
      isUp: req.body.isUp,
      datePlayed: Date.now()
    }).then(function(roll) {
      var number = Math.random() * 100;
      roll.actualNumber = number;
      roll.save();
      var profit = 0;
      if(number < req.body.chance) {
        var profit = Math.floor(1 / ((req.body.chance / 0.95) / 100) * req.body.amount * 100) / 100
      }
      User.findOne({
        where: {
          _id: req.user._id
        }
      }).then(function(user) {
        user.diamonds += profit;
        user.save();
      })
      res.send({
        realRoll: number,
        profit: profit
      });
      req.app.notifyClient(user._id, 'updateDiamonds');
    }).catch(function() {
      res.status(500);
    })
  });
}

export function history(req, res) {
  sequelize.query("SELECT Rolls.*, Users.personaname FROM Rolls,Users WHERE Users._id = Rolls.player ORDER BY Rolls._id DESC LIMIT 30", { type: sequelize.QueryTypes.SELECT })
    .then(respondWithResult(res))
    .catch(handleError(res));
}
