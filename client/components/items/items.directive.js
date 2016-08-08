'use strict';

angular.module('desktopApp')
  .directive('items', () => ({
    templateUrl: 'components/items/items.html',
    restrict: 'E',
    controller: 'ItemsController'
  }));
