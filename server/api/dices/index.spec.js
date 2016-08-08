'use strict';

var proxyquire = require('proxyquire').noPreserveCache();
var request = require('supertest');

var coinflipCtrlStub = {
  index: 'coinflipCtrl.index',
  show: 'coinflipCtrl.show',
  create: 'coinflipCtrl.create',
};

var routerStub = {
  get: sinon.spy(),
  post: sinon.spy(),
};

// require the index with our stubbed out modules
var coinflipIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './coinflip.controller': coinflipCtrlStub
});

var app = require('./../../app.js');
var passportStub = require('passport-stub')
var sqldb = require('./../../sqldb');
passportStub.install(app)
describe('Coinflip API:', function() {
  before(function(done) {
    app.on('listening', function() {
      passportStub.login({
        "_id": 1,
        "personaname": "Hex // SkinDuel.com",
        "profilepicture": "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d3/d366c43c99b7b4c7f98a28c8ec7aa3bfa95bed9f.jpg",
        "steamid": "76561198064998223",
        "diamonds": 1000,
        "totalBet": 0,
        "totalWon": 0
      })
      app.db.User.findOrCreate({
        where: {
          _id: 1
        },
        defaults: {
          steamid: "76561198064998223",
          personaname: "Hex // SkinDuel.com",
          profilepicture: "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/d3/d366c43c99b7b4c7f98a28c8ec7aa3bfa95bed9f.jpg",
          diamonds: 1000,
          _id: 1
        }})
      .then(app.db.User.update({
        diamonds: 1000
      }, {
        where: {
          _id: 1
        }
      }))
      .then(app.db.Coinflip.destroy({where:{}}))
      .then(function() {
        done(null)
      }).catch(function(err) {
        done(err);
      })
    })
  })
  it('returns a list of coinflips on GET /api/coinflips', function(done) {
    request(app)
      .get('/api/coinflips')
      .expect(200)
      .expect([], done);
  })
  it('creates a coinflip on POST /api/coinflips', function(done) {
    request(app)
      .post('/api/coinflips')
      .send({
        amount: 1,
        side: "T"
      })
      .expect(200, done)
  })
  it('subtracts credits on creating coinflip', function() {
    app.db.User.findById(1)
      .then(function(user) {
        expect(user.get('diamonds')).to.equal(999)
      })
  })
})
