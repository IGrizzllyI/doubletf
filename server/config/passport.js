'use strict';

import passport from 'passport';
import SteamStrategy from 'passport-steam';
import {User, Association} from './../sqldb';

export default function(app) {
  passport.serializeUser(function(user, done) {
    User.findOrCreate({
      where: {
        steamid: user.id
      },
      defaults: {
        steamid: user.id,
        personaname: user.displayName,
        profilepicture: user.photos[2].value
      }
    }).spread(function(userReceived, created) {
      userReceived.personaname = user.displayName;
      userReceived.profilepicture = user.photos[2].value;
      userReceived.save();
      done(null, userReceived._id);
    })
  });

  passport.deserializeUser(function(obj, done) {
    return User.find({
      where: {
        _id: obj
      }
    }).then(function(user) {
      return done(null, user);
    })
  });

  var steamStrat = new SteamStrategy.Strategy({
      returnURL: process.env.SITE_URI + 'auth/steam/return',
      realm: process.env.SITE_URI,
      apiKey: 'APIKEY'
    },
    function(identifier, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {

        // To keep the example simple, the user's Steam profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Steam account with a user record in your database,
        // and return that user instead.
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  );

  steamStrat.saveAssociation(function(handle, provider, algorithm, secret, expiresIn, done) {
    Assocation.create({
      handle: handle,
      provider: provider,
      algorithm: algorithm,
      secret: secret,
      expires: new Date(Date.now() + 1000 * expiresIn)
    }).then(done);
  });

  steamStrat.loadAssociation(function(handle, done) {
    Association.findOne({handle: handle})
      .then(function (error, result) {
        if (error) {
          return done(error);
        } else {
          return done(null, result.provider, result.algorithm, result.secret);
        }
      });
  });

  passport.use(steamStrat);
  app.use(passport.initialize());
  app.use(passport.session());
}
