'use strict';

angular.module('desktopApp')
  .directive('coinflip', () => ({
    templateUrl: 'components/coinflip/coinflip.html',
    restrict: 'E',
    controller: 'CoinflipController'
  }))
