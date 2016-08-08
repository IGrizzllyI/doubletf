'use strict';

angular.module('desktopApp')
  .config(function($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main',
        redirectTo: 'main.coinflip'
      })
      .state('main.coinflip', {
        url: 'coinflip',
        template: '<coinflip>'
      })
      .state('main.profile', {
        url: 'profile',
        template: '<profile>'
      })
      .state('main.roulette', {
        url: 'roulette',
        template: '<roulette>'
      })
      .state('main.dices', {
        url: 'dices',
        template: '<dices>'
      });
  }).run(['$rootScope', '$state', function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart', function(evt, to, params) {
      if (to.redirectTo) {
        evt.preventDefault();
        $state.go(to.redirectTo, params, {location: 'replace'})
      }
    });
  }]);
