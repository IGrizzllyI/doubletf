'use strict';

let ChatController = function($http, $scope) {
  $scope.socket.on('chatMessage', function(data) {
    var name = $('<p>' + data.user.personaname + '</p>').text();
    if(data.user.tags && data.user.tags.indexOf('admin') > -1) {
      data.user.tags.split(',').forEach((tag) => {
        name = '<span class="tag ' + tag + '">' + (function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()})(tag) + '</span>' + name;
      });
    }
    $('.chat').append('<div class=chat-message><img class=chat-avatar src=' + data.user.profilepicture + '><div class=chat-content><div class=chat-name>' + name + '</div><div class=chat-message>' + $('<p>' + data.message + '</p>').text() + '</div></div></div>');
    $('.chat').scrollTop($('.chat')[0].scrollHeight - $('.chat').height());
  });

  $('.chat-input input').keypress(function(e) {
    if (e.keyCode === 13) {
      if($scope.userInfo === undefined) {
        $scope.$emit('notify', 'Please login!', 'error');
        return;
      }
      if ($(this).val() != '') {
        $scope.socket.emit('chatMessage', $(this).val());
        $(".chat-input input").val('');
      }
    }
  });
};

angular.module('desktopApp')
  .controller('ChatController', ChatController);
