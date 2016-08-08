'use strict';

angular.module('desktopApp')
  .directive('roulette', () => ({
    templateUrl: 'components/roulette/roulette.html',
    restrict: 'E',
    controller: 'RouletteController'
  }));
