'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var tradeofferCtrlStub = {
  index: 'tradeofferCtrl.index',
  show: 'tradeofferCtrl.show'
};

var routerStub = {
  get: sinon.spy(),
  post: sinon.spy()
};

// require the index with our stubbed out modules
var tradeofferIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './tradeoffer.controller': tradeofferCtrlStub
});

describe('Tradeoffer API Router:', function() {

  it('should return an express router instance', function() {
    expect(tradeofferIndex).to.equal(routerStub);
  });

  describe('GET /api/tradeoffers', function() {

    it('should route to tradeoffer.controller.index', function() {
      expect(routerStub.get
        .withArgs('/', 'tradeofferCtrl.index')
        ).to.have.been.calledOnce;
    });

  });

  describe('GET /api/tradeoffers/:id', function() {

    it('should route to tradeoffer.controller.show', function() {
      expect(routerStub.get
        .withArgs('/:id', 'tradeofferCtrl.show')
        ).to.have.been.calledOnce;
    });

  });

});
