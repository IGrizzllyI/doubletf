'use strict';

function flipMe(side) {
    if (side === 'heads') {
      setTimeout(function() {
        $('.coin').addClass('flipTail');
      }, 100);
    } else {
      setTimeout(function() {
        $('.coin').addClass('flipHead');
      }, 100);
    }
}

let CoinflipController = function($http, $scope) {
  this.$http = $http;
  console.log($scope);

  $scope.coinflips = [];
  $scope.selected = 'T';

  $scope.noSpoilers = false;

  if($scope.userInfo) {
    $scope.maxKeys = $scope.userInfo.diamonds;
  } else {
    $scope.maxKeys = 0;
  }
  $scope.sliderAmount = 50;
  $scope.sliderDisplay = $scope.maxKeys / 2;

  $http.get('/api/coinflips').then(response => {
    $scope.coinflips = response.data;
  });

  $scope.$parent.$on('createGame', function(_, data) {
    let coinflip = data.coinflip;
    coinflip.player1data = data.user;
    coinflip.personaname = data.user.personaname;
    coinflip.profilepicture = data.user.profilepicture;
    $scope.coinflips.push(coinflip);
  });

  $scope.$parent.$on('updateFlip', function(_, data) {
    $scope.coinflips = $scope.coinflips.map((coinflip) => {
      if(coinflip._id === data._id) {
        return data;
      } else {
        return coinflip;
      }
    });

    setTimeout(() => {
      $scope.coinflips = $scope.coinflips.filter((coinflip) => {
        return coinflip._id !== data._id;
      });
      $scope.$apply();
    }, 15000);

    if($('.flip-modal').is(':visible') && $('.flip-modal').data('showing') === data._id) {
      $scope.showCoinflip(data, false);
    }
    if(data.player1 === $scope.userInfo._id) {
      $scope.showCoinflip(data, true);
    }
  });

  $scope.$on('updateCredits', function() {
    console.log('update', $scope);
    if($scope.userInfo) {
      $scope.maxKeys = $scope.userInfo.diamonds;
    } else {
      $scope.maxKeys = 0;
    }
    $scope.updateAmount();
  });

  $scope.showModal = function() {
    if($scope.userInfo === undefined) {
      $scope.$emit('notify', 'Please login!', 'error');
      return;
    }
    $('.create-modal').fadeIn(250);
  };

  $scope.hideModal = function() {
    $('.modal').hide();
    $('.coin').removeClass('flipHead');
    $('.coin').removeClass('flipTail');
  };

  $scope.showCoinflipById = function(id, shouldOpen) {
    shouldOpen = shouldOpen || true;
    $http.get('/api/coinflips/' + id).then((res) => {
      $scope.showCoinflip(res.data, shouldOpen);
      $scope.coinflips = $scope.coinflips.map((coinflip) => {
        if(coinflip._id === res.data._id) {
          return res.data;
        } else {
          return coinflip;
        }
      });
    });
  };

  $scope.showCoinflip = function(data, shouldOpen) {
    $('.flip-modal').data('showing', data._id);
    if(shouldOpen) {
        $('.flip-modal').show();
    }
    $('.flip-modal .versus-container .versus-player .amount').text(data.amount + ' key(s)');
    console.log(data);
    if(data.player1) {
      if(data.player1Side === 'T') {
        $('.flip-modal .versus-container .versus-player.left img').addClass('red');
        $('.flip-modal .versus-container .versus-player.left img').removeClass('blue');
      } else {
        $('.flip-modal .versus-container .versus-player.left img').addClass('blue');
        $('.flip-modal .versus-container .versus-player.left img').removeClass('red');
      }
      $http.get('/auth/account/' + data.player1).then(function(user1Data) {
        $('.flip-modal .versus-container .versus-player.left img').attr('src', user1Data.data.profilepicture);
        $('.flip-modal .versus-container .versus-player.left .username').text(user1Data.data.personaname);
      });
    } else {
      $('.flip-modal .versus-container .versus-player.left img').attr('src', 'https://steamdb.info/static/img/default.jpg');
      $('.flip-modal .versus-container .versus-player.left .username').text('');
    }
    if(data.player2) {
      if(data.player1Side === 'CT') {
        $('.flip-modal .versus-container .versus-player.right img').addClass('red');
        $('.flip-modal .versus-container .versus-player.right img').removeClass('blue');
      } else {
        $('.flip-modal .versus-container .versus-player.right img').addClass('blue');
        $('.flip-modal .versus-container .versus-player.right img').removeClass('red');
      }
      $http.get('/auth/account/' + data.player2).then(function(user2Data) {
        $('.flip-modal .versus-container .versus-player.right img').attr('src', user2Data.data.profilepicture);
        $('.flip-modal .versus-container .versus-player.right .username').text(user2Data.data.personaname);
      });
    } else {
      $('.flip-modal .versus-container .versus-player.right img').attr('src', 'https://steamdb.info/static/img/default.jpg');
      $('.flip-modal .versus-container .versus-player.right .username').text('');
    }
    if(data.winner !== 'Undecided') {
      $scope.noSpoilers = true;
      setTimeout(() => {$scope.noSpoilers = false;}, 5000);
      if(data.winner === 'Player 1') {
        if(data.player1Side === 'T') {
          flipMe('tails');
        } else {
          flipMe('heads');
        }
      } else if(data.winner === 'Player 2') {
        if(data.player1Side === 'CT') {
          flipMe('tails');
        } else {
          flipMe('heads');
        }
      }
    }
  };

  $scope.createGame = function() {
    $http.post('/api/coinflips', {
      side: $scope.selected,
      amount: $scope.sliderDisplay
    }).then((res) => {
      if(res.data !== 'Not enough credits!') {
        $scope.showCoinflipById(res.data, true);
      }
    });
  };

  $scope.selectRed = function() {
    $('.team-images .red').addClass('glow');
    $('.team-images .blue').removeClass('glow');
    $scope.selected = 'T';
  };

  $scope.selectBlue = function() {
    $('.team-images .red').removeClass('glow');
    $('.team-images .blue').addClass('glow');
    $scope.selected = 'CT';
  };

  $scope.$watch('userInfo', function() {
    if($scope.userInfo) {
      $scope.maxKeys = $scope.userInfo.diamonds;
      $scope.sliderDisplay = parseFloat($scope.sliderAmount / 100 * ($scope.maxKeys - 0.1) + 0.1).toFixed(2);
    }
  });

  $scope.updateAmount = function() {
    $scope.maxKeys = $scope.userInfo.diamonds;
    $scope.sliderDisplay = parseFloat($scope.sliderAmount / 100 * ($scope.maxKeys - 0.1) + 0.1).toFixed(2);
  };

  $scope.acceptGame = function(index) {
    $scope.acceptindex = index;
    $('.accept-modal').fadeIn(250);
    $scope.acceptkeys = $scope.coinflips[index].amount;
  };

  $scope.joinGame = function() {
    let coinflip = $scope.coinflips[$scope.acceptindex];
    $http.post('/api/coinflips/' + coinflip._id + '/accept').then(function(res) {
      $scope.showCoinflipById(res.data, true);
    }).catch(function(err) {
      if(err) {
        console.log(err);
      }
    });
  };

  $('coinflip').on('click', '.coinflip .username', function() {
    var id = $(this).parent().data('id');
    $scope.showCoinflipById(id, true);
  });

  $('coinflip').on('click', '.coinflip .in-progress', function() {
    var id = $(this).parent().data('id');
    $scope.showCoinflipById(id, true);
  });

};

angular.module('desktopApp')
  .controller('CoinflipController', CoinflipController);
