'use strict';

let NotificationsController = function($http, $scope){
  $scope.$on('notify', function(args, msg, level) {
    let notification = $('<div class="notification ' + level + '">' + msg + '</div>');
    $('.notifications').append(notification);
    setTimeout(function() {
      notification.fadeOut(300, function() { $(this).remove(); });
    }, 7000);
  });

  $('.notifications:not(.unclickable)').on('click', '.notification', function() {
    $(this).fadeOut(300, function() { $(this).remove(); });
  });
};

angular.module('desktopApp')
  .controller('NotificationsController', NotificationsController);
