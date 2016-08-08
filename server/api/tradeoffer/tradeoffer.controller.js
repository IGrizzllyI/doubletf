/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/tradeoffers              ->  index
 * POST    /api/tradeoffers              ->  create
 * GET     /api/tradeoffers/:id          ->  show
 * PUT     /api/tradeoffers/:id          ->  update
 * DELETE  /api/tradeoffers/:id          ->  destroy
 */

'use strict';

import _ from 'lodash';
import app from '../../app.js'
var User = require('../../sqldb').User;
var Tradeoffer = require('../../sqldb').Tradeoffer;
var sequelize = require('../../sqldb').sequelize;
import request from 'request';
import settings from '../../config/bot';
import getInventory from '../../components/passport/tf2.js';
import cacheManager from 'cache-manager';
import redisStore from 'cache-manager-redis';

var redisCache = cacheManager.caching({
  store: redisStore,
  host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost',
  port: process.env.REDIS_PORT_6379_TCP_PORT || 6379,
  db: 0,
  ttl: 600
})


var prices = {};
var inventory = {};

function getInventoryPromise(botID, options) {
  return new Promise(function(resolve, reject) {
    getInventory(botID, function(err, inventory) {
      if(err) {
        reject([]);
        return;
      }
      resolve(inventory);
    }, options);
  })
}

function updateInventory() {
  for(let botID of settings.bots) {
    getInventoryPromise(botID, {'unusual': 0.8, '': 1.05}).then(function(data) {
      inventory[botID] = data;
    })
  }
}
updateInventory();
setTimeout(updateInventory, 5000);
setInterval(updateInventory, 30000);

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
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

// Gets a list of Tradeoffers
export function index(req, res) {
  Tradeoffer.findAll()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Tradeoffer from the DB
export function show(req, res) {
  Tradeoffer.find({
    where: {
      _id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function deposit(req, res) {
  if(!req.body.items) {
    res.status(501).send("Parameter error!");
    return;
  }
  var itemsToReceive = req.body.items;
  var total = 0;
  getInventoryPromise(req.user.steamid, {'unusual': 0.8}).then((pricesForPartner) => {
    itemsToReceive.forEach((item) => {
      total += pricesForPartner[item].price.value; // will be credited if accepted
    })
    Tradeoffer.create({
      points: total,
      steamId: req.user.steamid,
      botSteamId: settings.bots[0],
      withdraw: 0,
      status: 0
    }).then((offer) => {
      req.app.botQueue.addToQueue(settings.bots[0], 'deposit', {items: req.body.items, token: req.body.token, steamid: req.user.steamid, uuid: offer.uuid}); //TODO: FIX THIS!
      res.send("Success!");
    })
  });
}

export function withdraw(req, res) {
  if(!req.body.botID || !req.body.item && req.body.botID != 'server') {
    res.status(501).send("Parameter error!");
    return;
  }
  Tradeoffer.count({
    where: {
      steamId: req.user.steamid,
      $or: {
        status: 0,
        status: '2',
        status: '4',
        status: '9',
        status: '11'
      }
    }
  }).then((count) => {
    if(count >= 5) {
      req.app.notifyClient(req.user._id, 'notify', {message: "Can't send more than 5 offers", level: 'error'});
      return;
    }

    getInventoryPromise(req.body.botID, {'unusual': 0.8, '': 1.05}).then((prices) => {
      if(Object.keys(prices).length === 0) {
        res.status(500).send("Couldn't load prices!");
        return;
      }
      User.find({
        where: {
          steamid: req.user.steamid
        }
      }).then((user) => {
        if(prices[req.body.item] === undefined) {
          res.status(500).send('Could not find item in bot backpack!');
          return;
        }
        let total = prices[req.body.item].price.value;
        if(user.get('diamonds') < total)  {
          res.status(400);
          req.app.notifyClient(user._id, 'notify', {message: "You do not have enough keys!", level: 'error'});
          return;
        }
        // if(user.get('amountWithdrawable') < total) {
        //   res.status(400);
        //   req.app.notifyClient(user._id, 'notify', {message: "You must bet at least 50% of deposited items. You are currently allowed to withdraw " + user.get('amountWithdrawable') + " keys.", level: 'error'});
        //   return;
        // }
        user.decrement('diamonds', {'by': Math.round(total * 100) / 100})
        user.decrement('amountWithdrawable', {'by': Math.round(total * 100) / 100});
        user.save();
        req.app.notifyClient(user._id, 'updateDiamonds');
        Tradeoffer.create({
          points: Math.round(total * 100) / 100,
          steamId: req.user.steamid,
          botSteamId: settings.bots[0],
          withdraw: 1,
          status: 0
        }).then((offer) => {
          req.app.botQueue.addToQueue(req.body.botID, 'withdraw', {item: req.body.item, token: req.body.token, steamid: req.user.steamid, uuid: offer.uuid});
          res.send("Success!");
        })
      })
    })
  })
}

export function inventory(req, res) {
  res.json(inventory).status(200);
}
