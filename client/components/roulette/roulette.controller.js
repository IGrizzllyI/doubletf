'use strict';
let RouletteController = function($http, $scope){
  $scope.spin = function(number) {
    var x = -((2200 - $(".roulette").width() / 2) + number * 100);
    $('.roulette').transition({"background-position": x + "px 0px"}, 7000,"cubic-bezier(0,.84,.11,.99)");
  }

  $scope.resetDraw = function() {
    $(".roulette").css({"background-position": $(".roulette").width() / 2 + "px 0px"});
  }

  $scope.selectCoin = function(coinId) {
    $('.roulette-side').removeClass('selected');
    $('.roulette-side[data-coin-id="' + coinId + '"]').addClass('selected');
  }
};

angular.module('desktopApp')
  .controller('RouletteController', RouletteController);
