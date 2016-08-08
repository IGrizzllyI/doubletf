'use strict';

angular.module('desktopApp')
  .directive('chat', () => ({
    templateUrl: 'components/chat/chat.html',
    restrict: 'E',
    controller: 'ChatController'
  }));
