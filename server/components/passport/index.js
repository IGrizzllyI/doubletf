/**
 * Passport Authentication
 */

'use strict';

import express from 'express';
import passport from 'passport';
import ensureAuthenticated from './../../middleware/ensureAuthenticated';
import {User} from '../../sqldb';
import getInventory from './tf2.js'
import cacheManager from 'cache-manager';
import redisStore from 'cache-manager-redis';

var redisCache = cacheManager.caching({
  store: redisStore,
  host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost',
  port: process.env.REDIS_PORT_6379_TCP_PORT || 6379,
  db: 0,
  ttl: 600
})

var router = express.Router();


function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
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

router.get('/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {

    //add ref code if needed
    User.find({
      where: {
        steamid: req.user.id
      }
    }).then((user) => {
      if(user.get('referredBy') === null && req.session.ref) {
        user.set('referredBy', req.session.ref);
        user.save();
      }
      res.redirect('/');
    })
  }
);

router.get('/account', ensureAuthenticated, function(req, res){
  res.json(req.user);
});

router.get('/account/:id', function(req, res) {
  User.find({
    where: {
      _id: req.params.id
    }
  }).then(respondWithResult(res))
  .catch(handleError(500))
});

router.get('/inventory', ensureAuthenticated, function(req, res){
  getInventory(req.user.steamid, function(err, inventory) {
    res.json(inventory);
  }, {'unusual': 0.7})
});

router.get('/logout', ensureAuthenticated, function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
