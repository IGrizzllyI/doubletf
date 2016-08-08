'use strict';

angular.module('desktopApp')
  .directive('notifications', () => ({
    templateUrl: 'components/notifications/notifications.html',
    restrict: 'E',
    controller: 'NotificationsController'
  }));
