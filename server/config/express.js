/**
 * Express configuration
 */

'use strict';

import express from 'express';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import path from 'path';
import config from './environment';
import session from 'express-session';
import sqldb from '../sqldb';
import compression from 'compression';
import morgan from 'morgan';
import RateLimit from 'express-rate-limit';
import url from 'url';
import timeout from 'connect-timeout';

var SequelizeSession = require('express-sequelize-session')(session.Store);


export default function(app, io, redis) {
  var env = app.get('env');
  app.enable('trust proxy');
  app.use(morgan('tiny', {
  }));
  var apiLimiter = new RateLimit({
    windowMs: 2000, // 15 minutes
    max: 4,
    delayMs: 0 // disabled
  });
  app.use('/api/', apiLimiter);
  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(compression());

  // Persist sessions with mongoStore / sequelizeStore
  // We need to enable sessions for passport-twitter because it's an
  // oauth 1.0 strategy, and Lusca depends on sessions
  let sessionStore = session({
    name: 'sid',
    secret: config.secrets.session,
    saveUninitialized: true,
    resave: true,
    store: SequelizeSession(sqldb.sequelize)
  });
  app.use(sessionStore);

  io.use(function(socket, next){
    // Wrap the express middleware
    sessionStore  (socket.request, {}, next);
  });

  // add ref code to cookies
  app.use(function(req, res, next) {
    req.requrl = url.parse(req.url, true);
    if(req.requrl.query.ref !== undefined) {
      req.session.ref = req.requrl.query.ref;
    }
    next();
  })

  app.set('appPath', path.join(config.root, 'build'));
  console.log(app.get('appPath'));
  if ('production' === env) {
    console.log(app.get('appPath'));
    app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(express.static(app.get('appPath')));
  }

  if ('development' === env || 'test' === env) {
    app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(require('connect-livereload')());
    app.use(express.static(app.get('appPath')));
  }
}
