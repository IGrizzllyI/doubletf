'use strict';
let DicesController = function($http, $scope){

  $scope.winChance = 47.5;
  $scope.multiplier = 2;
  $scope.betAmount = 0.1;
  $scope.profit = 0.02;
  $scope.underOver = 'under';
  $scope.rolling = false;
  $scope.scoreToShow = null;
  $scope.rollButtonClass = '';

  $http.get('/api/dices/history').then(function(res) {
    $scope.dicesHistory = res.data.map(function(item) {
      item.datePlayed = new Date(item.datePlayed).toLocaleTimeString();
      if(item.actualNumber < item.winNumber) {
        item.profit = '+' + Math.floor(1 / ((item.winNumber / 0.95) / 100) * 100) / 100 * item.amountWagered / 2;
      } else {
        item.profit = '-' + item.amountWagered;
      }
      return item;
    });
  })

  $scope.updateUsingChance = function(chance) {

  }

  $scope.changeWinChance = function() {
    if($scope.winChance > 95) {
      $scope.winChance = 95;
    }

    if($scope.winChance < 0) {
      $scope.winChance = 0;
    }

    $scope.multiplier = Math.floor(1 / (($scope.winChance / 0.95) / 100) * 100) / 100;
    $scope.profit = $scope.betAmount * $scope.multiplier;
  };

  $scope.changeMultiplier = function() {
    if($scope.multiplier < 1) {
      $scope.multiplier = 1
    }
    $scope.winChance = Math.floor((1 / $scope.multiplier) * 9500) / 100;
    $scope.profit = $scope.betAmount * $scope.multiplier;
  }

  $scope.$watch('betAmount', function() {
    $scope.profit = $scope.betAmount * $scope.multiplier;
  });

  $scope.half = function() {
    $scope.betAmount = Math.round($scope.betAmount * 50) / 100;
  }

  $scope.double = function() {
    $scope.betAmount = Math.round($scope.betAmount * 200) / 100;
  }

  $scope.min = function() {
    $scope.betAmount = 0.1;
  }

  $scope.max = function() {
    $scope.betAmount = $scope.$parent.userInfo.diamonds;
  }

  $scope.changeUnderOver = function() {
    console.log('ay')
    // if($scope.underOver === 'under') {
    //   $scope.underOver = 'over';
    // } else if($scope.underOver === 'over') {
    //   $scope.underOver = 'under';
    // }
  }

  $scope.roll = function() {
    if($scope.scoreToShow) {
      $scope.scoreToShow = null;
      $scope.rollButtonClass = '';
      return;
    }
    if($scope.rolling) {
      return;
    }
    $scope.rolling = true;
    $scope.rollButtonClass = 'rolling';
    setTimeout(function() { // sorry, for effect :P
      var winChance = $scope.winChance;
      var amount = $scope.betAmount;
      var isUp = $scope.underOver === 'over';
      $http.post('/api/dices/roll', {
        amount: $scope.betAmount,
        chance: $scope.winChance,
        isUp: $scope.underOver === 'over'
      }).then(function(res) {
        $scope.rolling = false;
        $scope.scoreToShow = 'Rolled a ' + res.data.realRoll.toFixed(2);
        console.log(isUp, winChance, amount);
        if((isUp && res.data.realRoll > winChance) || (!isUp && res.data.realRoll < winChance)) {
          $scope.rollButtonClass = 'win';
          $scope.scoreToShow = 'You\'ve rolled a ' + res.data.realRoll.toFixed(2) + '. YOU\'VE WON!';
        } else {
          $scope.rollButtonClass = 'lose';
          $scope.scoreToShow = 'You\'ve rolled a ' + res.data.realRoll.toFixed(2) + '. YOU\'VE LOST!';
        }
      }).catch(function() {
        $scope.rolling = false;
        $scope.rollButtonClass = '';
      })
    }, 1000);
  }
};

angular.module('desktopApp')
  .controller('DicesController', DicesController);
