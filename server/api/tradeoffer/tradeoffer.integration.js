'use strict';

var app = require('../..');
import request from 'supertest';

var newTradeoffer;

describe('Tradeoffer API:', function() {

  describe('GET /api/tradeoffers', function() {
    var tradeoffers;

    beforeEach(function(done) {
      request(app)
        .get('/api/tradeoffers')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          tradeoffers = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      expect(tradeoffers).to.be.instanceOf(Array);
    });

  });
});
