'use strict';

angular.module('desktopApp', [
  'desktopApp.constants',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router'
])
  .config(function($urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/coinflip');
    $locationProvider.html5Mode(true);
  });
