'use strict';

let NavbarController = function($http, $scope, $state) {

  this.loggedin = false;
  this.loggedintext = 'Loading...';

  this.isCollapsed = true;

  $scope.state = $state;
  console.log($state);

  $scope.noSpoilerDiamonds = 0;

  $('.referral-modal').remodal();

  $http.get('/auth/account').then(response => {
    if(response.data === '') {
      $scope.nav.loggedin = false;
      return;
    }
    $scope.$emit('updateCredits');
    $scope.nav.loggedin = true;
    $scope.userInfo = response.data;
    $('.steamid').text($scope.userInfo.steamid);
    $scope.nav.username = response.data.personaname;
    $scope.nav.diamonds = response.data.diamonds;
    $scope.nav.loggedintext = response.data.personaname + ' | ' + response.data.diamonds + ' ';
  });
  $scope.$on('refreshDiamonds', function() {
    $http.get('/auth/account').then(response => {
      $scope.nav.loggedin = true;
      $scope.userInfo = response.data;
      $scope.nav.username = response.data.personaname;
      $scope.nav.diamonds = response.data.diamonds;
      $scope.nav.loggedintext = response.data.personaname + ' | ' + response.data.diamonds + ' ';
      $scope.$emit('updateCredits');
    });
  });
  // $('.deposit-nav').unbind('click');
  // $('.deposit-nav').click(function() {
  //   if($scope.userInfo === undefined) {
  //     $scope.$emit('notify', "Please login!", 'error');
  //     return;
  //   }
  //   $('.deposit-modal').fadeIn(250);
  // });
  // $('.withdraw-nav').unbind('click');
  // $('.withdraw-nav').click(function() {
  //   if($scope.userInfo === undefined) {
  //     $scope.$emit('notify', "Please login!", 'error');
  //     return;
  //   }
  //   $('.withdraw-modal').fadeIn(250);
  // });
};

angular.module('desktopApp')
  .controller('NavbarController', NavbarController);
