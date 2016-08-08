/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/coinflips              ->  index
 * POST    /api/coinflips              ->  create
 * GET     /api/coinflips/:id          ->  show
 * POST     /api/coinflips/:id/accept  ->  accept
 */
'use strict';

import _ from 'lodash';
import {
  User,
  Coinflip,
  sequelize
} from '../../sqldb';

function respondWithResult(res, statusCode, uno) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (uno) {
      entity = entity[0];
    }
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
      coinflip.active = coinflip.winner !== "Undecided";
      coinflip.joinable = coinflip.player2 === "0";
      return coinflip;
    })
    return coinflips;
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

// Gets a list of Things
export function index(req, res) {
  sequelize.query("SELECT Coinflips.*, Users.personaname, Users.profilepicture FROM Coinflips,Users WHERE Users._id = Coinflips.player1 AND (winner = 'Undecided' OR accepted > NOW() - INTERVAL 30 SECOND)", { type: sequelize.QueryTypes.SELECT })
    .then(parseOutput())
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Thing from the DB
export function show(req, res) {
  sequelize.query("SELECT Coinflips.*, Users.personaname, Users.profilepicture FROM Coinflips,Users WHERE Users._id = Coinflips.player1 AND Coinflips._id = " + Number(req.params.id),
    { type: sequelize.QueryTypes.SELECT
    })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res, 200, true))
    .catch(handleError(res));
}

// Creates a new Thing in the DB
export function create(req, res) {
  if (req.body.side === undefined || Number(req.body.amount) < 0.1 || req.body.amount === undefined || !(req.body.side === 'T' || req.body.side === 'CT')) {
    res.status(400).send("Bad Request")
    return;
  }
  return Coinflip.count({
    where: {
      player1: req.user._id,
      winner: 'Undecided'
    }
  }).then((count) => {
    if (count < 5) {
      return sequelize.transaction().then(function(t) {
        return Coinflip.create({
            player1: req.user._id,
            player1Side: req.body.side,
            player2: "0",
            amount: Number(req.body.amount)
          }, {
            transaction: t
          })
          .then(function(coinflip) {
            return User.findOne({
              where: {
                _id: req.user._id
              }
            }).then(function(user) {
              var diamonds = user.get('diamonds');
              var amountWithdrawable = user.get('amountWithdrawable');
              if (diamonds >= Number(req.body.amount)) {
                user.set('diamonds', diamonds - Number(req.body.amount));
                if(user.get('amountWithdrawable') + Number(req.body.amount) >= user.get('diamonds')) {
                  user.set('amountWithdrawable', user.get('diamonds'));
                } else {
                  user.set('amountWithdrawable', user.get('amountWithdrawable') + Number(req.body.amount));
                }
                user.save();
                req.app.notifyClient(user._id, 'updateDiamonds');
                t.commit()
                  .then(function() {
                    coinflip.personaname = user.personaname;
                    coinflip.profilepicture = user.profilepicture;
                    req.app.socket.emit('createGame', {
                      coinflip: coinflip,
                      user: user
                    })
                    return coinflip._id;
                  })
                  .then(respondWithResult(res, 200));
              } else {
                t.rollback()
                  .then(function() {
                    req.app.notifyClient(user._id, 'notify', {
                      message: "Not enough credits!",
                      level: 'error'
                    });
                    return "Not enough credits!"
                  })
                  .then(handleError(res));
              }
            })
            .catch(handleError(res));
          })
          .catch(handleError(res));
      })
      .catch(handleError(res));;
    } else {
      res.send("Can't add more than 5 coinflips!");
    }
  })
  .catch(handleError(res));
}

export function accept(req, res) {
  if (req.user) {
    return sequelize.transaction().then(function(t) {
        return Coinflip.find({
          where: {
            _id: req.params.id,
            winner: 'Undecided'
          }
        }).then(function(coinflip) {
          if(coinflip) {
            return User.findOne({
              where: {
                _id: req.user._id
              }
            }).then(function(user) {
                var diamonds = user.get('diamonds');
                var coinflipCost = coinflip.get('amount');
                var player2id = coinflip.get('player2');
                var player1id = coinflip.get('player2');
                if (diamonds >= coinflipCost && coinflip.get('player2') == "0" && coinflip.get('player1') !== user.get('_id')) {
                  user.set('diamonds', diamonds - coinflipCost);
                  if(user.get('amountWithdrawable') + coinflipCost >= user.get('diamonds')) {
                    user.set('amountWithdrawable', user.get('diamonds'));
                  } else {
                    user.set('amountWithdrawable', user.get('amountWithdrawable') + coinflipCost);
                  }
                  coinflip.set('player2', user.get('_id'));
                  coinflip.set('winner', (Math.round(Math.random()) == 0) ? "Player 1" : "Player 2");
                  coinflip.set('accepted', Date.now());
                  if (coinflip.get('winner') == "Player 1") { // dont save since this is done straight in the db
                    User.findOne({
                      where: {
                        _id: coinflip.get('player1')
                      }
                    }).then((player1) => {
                      var mult = 190;
                      if (player1.get('personaname').toLowerCase().indexOf('double.tf') > -1) {
                        mult = 192;
                      }
                      player1.set('diamonds', player1.get('diamonds') + Math.round(coinflipCost * mult) / 100)
                      player1.set('amountWithdrawable', player1.get('amountWithdrawable') + Math.round(coinflipCost * mult) / 100)
                      user.save({
                          transaction: t
                        })
                        .then(() => {
                          return coinflip.save({
                            transaction: t
                          })
                        })
                        .then(() => {
                          return player1.save({
                            transaction: t
                          })
                        })
                        .then(() => {
                          return t.commit()
                            .then(function() {
                              setTimeout(() => {
                                req.app.notifyClient(user._id, 'updateDiamonds');
                                req.app.notifyClient(player1._id, 'updateDiamonds');
                                req.app.notifyClient(player1._id, 'notify', {
                                  message: '<b>Congratulations!</b> You won! ' + Math.round(coinflipCost * mult) / 100 + ' keys have been credited to your account!',
                                  level: 'success'
                                })
                              }, 4000);
                              coinflip.personaname = player1.personaname;
                              coinflip.profilepicture = player1.profilepicture;
                              req.app.socket.emit('updateFlip', coinflip.dataValues);

                              return coinflip._id;
                            })
                            .then(respondWithResult(res, 200))
                            .catch(handleError(res));
                        })
                        .catch(handleError(res));;
                    })
                    .catch(handleError(res));
                  } else {
                    var mult = 190;
                    if (user.get('personaname').toLowerCase().indexOf('double.tf') > -1) {
                      mult = 192;
                    }
                    user.set('diamonds', user.get('diamonds') + Math.round(coinflipCost * mult) / 100)
                    user.set('amountWithdrawable', user.get('amountWithdrawable') + Math.round(coinflipCost * mult) / 100)
                    coinflip.save({
                        transaction: t
                      })
                      .then(() => {
                        return user.save({
                          transaction: t
                        })
                      })
                      .then(() => {
                        return t.commit()
                          .then(function() {

                            req.app.socket.emit('updateFlip', coinflip);
                            setTimeout(() => {
                              req.app.notifyClient(user._id, 'updateDiamonds');
                              req.app.notifyClient(user._id, 'notify', {
                                message: '<b>Congratulations!</b> You won! ' + Math.round(coinflipCost * mult) / 100 + ' keys have been credited to your account!',
                                level: 'success'
                              })
                            }, 4000);
                            return coinflip._id
                          })
                          .then(respondWithResult(res, 200))
                          .catch(handleError(res));
                      })
                      .catch(handleError(res));;
                  }
                } else {
                  t.rollback()
                    .then(function() {
                      req.app.notifyClient(user._id, 'notify', {
                        message: "Can't accept your own coinflip or don't have enough credits!",
                        level: 'error'
                      });
                      return "Error!"
                    })
                    .then(handleError(res));
                }
            })
            .catch(handleError(res));
          } else {
            res.status(404).send("No coinflips found!")
          }
        })
        .catch(handleError(res));
    })
    .catch(handleError(res));
  } else {
    res.status(401).send('Please login!')
  }
}
