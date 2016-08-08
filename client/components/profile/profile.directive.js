'use strict';

angular.module('desktopApp')
  .directive('profile', () => ({
    templateUrl: 'components/profile/profile.html',
    restrict: 'E',
    controller: 'ProfileController'
  }));
