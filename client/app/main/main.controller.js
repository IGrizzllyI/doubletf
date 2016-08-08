'use strict';

(function() {

let MainController = function($scope) {
  console.log('Welcome to the console. You must be a nerd.');
  $scope.socket = io();

  // $scope.socket.on('disconnect', function ()  {
  //   $scope.$emit('notify', 'Disconnected from main server!', 'error')
  // })
  // $scope.socket.on('reconnect', function ()  {
  //   $scope.$emit('notify', 'Reconnected to main server!', 'success');
  // })
  $scope.socket.on('notify', function (data)  {
    $scope.$emit('notify', data.message, data.level);
  });
  $scope.socket.on('updateDiamonds', function() {
    setTimeout(() => {
      $scope.$emit('refreshDiamonds');
    }, 1000);
  });
  $scope.socket.on('createGame', function(data) {
    console.log('a', data);
    $scope.$emit('createGame', data);
  });
  $scope.socket.on('updateFlip', function(data) {
    console.log('b', data);
    $scope.$emit('updateFlip', data);
  });
  $scope.test = 'hi';
};

angular.module('desktopApp')
  .controller('MainController', MainController);

})();
