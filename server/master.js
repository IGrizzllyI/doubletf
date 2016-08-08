/**
 * Main application file
 */

'use strict';

require('pmx').init({
  http: true
});

import express from 'express';
import sqldb from './sqldb';
import config from './config/environment';
import http from 'http';
import {BotQueue} from './botQueue';
import redisq from 'redisq';
import getInventory from './components/passport/tf2.js';
import net from 'net';
var cluster = require('cluster');
var debug = require('debug')('app:main');


var redis;

if(process.env.NODE_ENV === 'test') {
  redis = require('redis-mock').createClient();
  var pub = require('redis-mock').createClient();
  var sub = require('redis-mock').createClient({ return_buffers: true });
} else {
  if (process.env.REDIS_PORT_6379_TCP_ADDR) {
    redis = require("redis").createClient(process.env.REDIS_PORT_6379_TCP_PORT, process.env.REDIS_PORT_6379_TCP_ADDR);

    if(process.env.REDIS_PASSWORD !== undefined) {
      redis.auth(process.env.REDIS_PASSWORD);
    }

    var pub = require("redis").createClient(
      process.env.REDIS_PORT_6379_TCP_PORT,
      process.env.REDIS_PORT_6379_TCP_ADDR
    );
    var sub = require("redis").createClient(
      process.env.REDIS_PORT_6379_TCP_PORT,
      process.env.REDIS_PORT_6379_TCP_ADDR,
      {return_buffers: true}
    );
  } else {
    redis = require("redis").createClient();
    var pub = require("redis").createClient();
    var sub = require("redis").createClient({ return_buffers: true });
  }
}

function getInventoryPromise(botID, options) {
  return new Promise(function(resolve, reject) {
    getInventory(botID, function(err, inventory) {
      if(err) {
        reject([]);
        return;
      }
      resolve(inventory);
    }, options || {})
  })
}


var num_processes = require('os').cpus().length;

var io = require('socket.io-emitter')({ host: process.env.REDIS_PORT_6379_TCP_ADDR || '127.0.0.1', port: process.env.REDIS_PORT_6379_TCP_PORT || 6379 });
var botQueue = new BotQueue(true);
var db = sqldb;

var notifyClient = function(id, message, data) {
  io.to('user' + id).emit(message, data)
}

botQueue.on('updateOffer', function(data) {
  db.Tradeoffer.find({
    where: {
      uuid: data.uuid
    }
  }).then((offer) => {
    db.User.find({
      where: {
        steamid: offer.steamId
      }
    }).then((user) => {
      console.log(user);
      if(Number(data.state) === 1 || (offer._id === null && data.id === null)) {
        if(offer.withdraw === true) {
          user.set('diamonds', user.get('diamonds') + offer.points);
          notifyClient(user._id, 'updateDiamonds');
          user.save();
        }
        notifyClient(user._id, 'notify', {message: "Error sending offer!", level: 'error'});
        offer.status = -1;
        offer.save();
        return;
      }
      if(offer._id === null) {
        offer.set('_id', data.id);
        notifyClient(user._id, 'notify', {message: "Offer sent... Waiting for confirmation! Click <a href='https://steamcommunity.com/tradeoffer/" + offer._id + "/' target='_blank'>here</a> to view the offer!", level: 'success unclickable'});
      }
      let oldState = Number(offer.status);
      offer.status = Number(data.state);
      // if((oldState === 9 || oldState === 0) && offer.status === 2) { // Waiting for Confirmations -> Active
      //   // dont need anymore
      // }
      if(oldState === 2 && offer.status === 3 && offer.withdraw === false) { // Active -> Accepted
        // update credits
        console.log('Offer ' + offer.uuid + ' accepted! Crediting ' + offer.steamId);
        db.User.find({
          where: {
            steamid: offer.steamId
          }
        }).then((user) => {
          user.set('diamonds', user.get('diamonds') + offer.points);
          if(user.get('referredBy') !== null && user.get('referredBy') !== user.get('steamid')) {
            db.User.find({
              where: {
                steamid: user.referredBy
              }
            }).then((userReferredBy) => {
              if(!userReferredBy) {
                return;
              } else {
                userReferredBy.set('diamonds', userReferredBy.get('diamonds') + Math.round(Number(offer.points) * 100) / 10000);
                userReferredBy.save();
              }
            })
          }
          if(user.get('amountWithdrawable') + Math.round(offer.points / 2.0 * 100) / 100 > user.get('diamonds')) {
            user.set('amountWithdrawable', user.get('diamonds'));
          } else {
            user.set('amountWithdrawable', user.get('amountWithdrawable') + Math.round(offer.points / 2.0 * 100) / 100);
          }
          notifyClient(user._id, 'notify', {message: "Offer accepted. " +  offer.points + " keys added to your account!", level: 'success'});
          notifyClient(user._id, 'updateDiamonds');
          user.save();
        });
      }

      if((offer.status === 4 || offer.status === 7 || offer.status === 8 || offer.status === 10) && offer.withdraw === true) {
        db.User.find({
          where: {
            steamid: offer.steamId
          }
        }).then((user) => {
          user.set('diamonds', user.get('diamonds') + offer.points);
          notifyClient(user._id, 'notify', {message: "Offer declined. Credits refunded!", level: 'error'});
          notifyClient(user._id, 'updateDiamonds');
          if(user.get('amountWithdrawable') + Math.round(offer.points * 100) / 100 > user.get('diamonds')) {
            user.set('amountWithdrawable', user.get('diamonds'));
          } else {
            user.set('amountWithdrawable', user.get('amountWithdrawable') + Math.round(offer.points * 100) / 100);
          }
          user.save();
        });
      }
      offer.save();
    })
  })
})

//
// botQueue.on('cancelled', function(offerid) {
//   db.Tradeoffer.find({
//     where: {
//       _id: offerid
//     }
//   }).then((offer) => {
//     if(offer === undefined) {
//       console.log("Untracked offer: " + offerid);
//     }
//     if(offer.get('withdraw')) {
//       let userSteamId = offer.steamId;
//       db.User.findOne({
//         where: {
//           steamid: userSteamId
//         }
//       }).then((user) => {
//         user.increment('diamonds', {'by': Math.round(offer.points * 100) / 100});
//         user.increment('amountWithdrawable', {'by': Math.round(offer.points * 100) / 200});
//         notifyClient(user._id, 'updateDiamonds');
//         user.save();
//         offer.set('status', 'refunded');
//         notifyClient(user._id, 'notify', {message: "Offer declined. Credits refunded!", level: 'error'});
//         offer.save();
//       })
//     }
//     offer.set('status', 'cancelled');
//     offer.save();
//     db.User.findOne({
//       where: {
//         steamid: offer.steamId
//       }
//     }).then((user) => {
//       notifyClient(user._id, 'notify', {message: "Offer declined. No credits added", level: 'error'});
//     })
//   })
// })
// botQueue.on('confirmed', function(offerid) {
//   db.Tradeoffer.find({
//     where: {
//       _id: offerid
//     }
//   }).then((offer) => {
//     if(!offer) {
//       return;
//     }
//     if(offer.get('withdraw') === false) {
//       let userSteamId = offer.steamId;
//       db.User.findOne({
//         where: {
//           steamid: userSteamId
//         }
//       }).then((user) => {
//         user.increment('diamonds', {'by': Math.round(offer.points * 100) / 100});
//         user.increment('amountWithdrawable', {'by': Math.round(offer.points * 100) / 200});
//         notifyClient(user._id, 'updateDiamonds');
//         notifyClient(user._id, 'notify', {message: "Offer accepted. " +  Math.round(offer.points * 100) / 100 + " keys added to your account!", level: 'success'});
//         user.save();
//         offer.set('status', 'credited');
//         offer.save();
//       })
//     }
//   })
// })
