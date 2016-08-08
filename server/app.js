/**
 * Main application file
 */

'use strict';

import express from 'express';
import sqldb from './sqldb';
import config from './config/environment';
import http from 'http';
import {BotQueue} from './botQueue';
import redisq from 'redisq';
import getInventory from './components/passport/tf2.js';
import net from 'net';
var debug = require('debug')('app:main');


var redis;

process.on('uncaughtException', function(e) {
  console.log('An error has occured. error is: %s and stack trace is: %s', e, e.stack);
  console.log("Process will restart now.");
})

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

function getInventoryPromise(botID) {
  return new Promise(function(resolve, reject) {
    getInventory(botID, function(err, inventory) {
      if(err) {
        reject([]);
        return;
      }
      resolve(inventory);
    })
  })
}

// io.set('transports', ['websocket']);

var num_processes = require('os').cpus().length;

// Setup server
var app = express();
http.globalAgent.maxSockets = 999;
var server = http.createServer(app);
var io = require("socket.io")(server);
var adapter = require('socket.io-redis');
io.adapter(adapter({pubClient: pub, subClient: sub}))

require('./config/express')(app, io);
require('./config/passport')(app);
require('./routes')(app);
require('./socket')(io, app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, function() {
    debug('Express server listening on %d, in %s mode', config.port, app.get('env')); // debug to not stall grunt
    app.emit('listening')
  });
}

app.notifyClient = function(id, message, data) {
  app.socket.to('user' + id).emit(message, data)
}

app.db = sqldb;

app.botQueue = new BotQueue(false);

app.redis = redis;

app.db.sequelize.sync()
  .then(startServer)
  .catch(function(err) {
    debug('Server failed to start due to error: %s', err);
  });

// Expose app
exports = module.exports = app;
