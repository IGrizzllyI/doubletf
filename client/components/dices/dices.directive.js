'use strict';

angular.module('desktopApp')
  .directive('dices', () => ({
    templateUrl: 'components/dices/dices.html',
    restrict: 'E',
    controller: 'DicesController'
  }));
