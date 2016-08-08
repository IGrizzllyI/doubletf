'use strict';

let ItemsController = function($http) {
  this.$http = $http;

  let tradeUrl = window.localStorage.getItem('tradeUrl');
  if(tradeUrl) {
    $('.trade-url input').val(tradeUrl);
  }

  let depositModal = $('.deposit-modal').remodal({
    closeOnConfirm: false
  });
  $('.withdraw-modal').remodal();
  $('.buy-modal').remodal();

  $('.deposit-modal .items').on('click', '.item', function() {
    $(this).toggleClass('selected');
  });
  function updateInventory() {
    $http.get('/auth/inventory').then((response) => {
      let items = response.data;
      if(response.error || !response.data) {
        console.log('Could not refresh inventory!');
        return;
      }
      $('.deposit-modal .items').empty();
      $.each(items, function(id, data) {
        $('.deposit-modal .items').append('<div class="item" data-asset-id="' + data.assetid + '"><img src="https://steamcommunity-a.akamaihd.net/economy/image/' + data.icon_url + '/75fx75f"/><div class="name">' + data.market_hash_name + '</div><div class="price">' + data.price.value.toFixed(2) + ' keys</div></div>');
      });
      $('.sort-deposit').change();
    });
  }

  function updateWithdrawInventory() {
    $http.get('/api/tradeoffers/inventory').then((response) => {
      let finalItems = [];
      let bots = response.data;
      if(response.error || !response.data) {
        console.log('Could not refresh inventory!');
        return;
      }
      $.each(bots, function(botID, bot) {
        $.each(bot, function(itemID, item) {
          item.botID = botID;
          finalItems.push(item);
        });
      });
      $('.withdraw-modal .items').empty();
      $.each(finalItems, function(id, data) {
        var overlay = '';
        if(data.attributes !== undefined && typeof data.attributes === typeof []) {
    	    data.attributes.forEach(function(item) {
            if(item.defindex === 134) {
              overlay = '<img src="https://backpack.tf/images/440/particles/' + item.float_value + '_94x94.png" class="overlay-item">';
            }
          });
        }
        $('.withdraw-modal .items').append('<div class="item" data-asset-id="' + data.assetid + '" data-bot-id="' + data.botID + '"><div class="item-image-container"><img class="item-image-main" src="https://steamcommunity-a.akamaihd.net/economy/image/' + data.icon_url + '/75fx75f"/>' + overlay + '</div><div class="name">' + data.market_hash_name + '</div><div class="price">' + data.price.value.toFixed(2) + ' keys</div><a class="item-button buy-item" href="#buy-modal">Buy Item</div></div>');
      });
      $('.sort-withdraw').change();
    });
  }
  updateWithdrawInventory();

  updateInventory();
  $('.cancel').click(function() {
    $(this).parent().parent().fadeOut(250);
  });
  $('.refresh-deposit').on('click', updateInventory);
  $('.refresh-withdraw').on('click', updateWithdrawInventory);

  $('.search-withdraw').keyup(function() {
    let value = $('.search-withdraw').val();
    $('.withdraw-modal .items .item .name').filter(function(_, item) {
      return $(item).text().toLowerCase().indexOf(value.toLowerCase()) === -1;
    }).parent().hide();
    $('.withdraw-modal .items .item .name').filter(function(_, item) {
      return $(item).text().toLowerCase().indexOf(value.toLowerCase()) > -1;
    }).parent().show();
  });

  $('.search-deposit').keyup(function() {
    let value = $('.search-deposit').val();
    $('.deposit-modal .items .item .name').filter(function(_, item) {
      return $(item).text().toLowerCase().indexOf(value.toLowerCase()) === -1;
    }).parent().hide();
    $('.deposit-modal .items .item .name').filter(function(_, item) {
      return $(item).text().toLowerCase().indexOf(value.toLowerCase()) > -1;
    }).parent().show();
  });

  $('.sort-withdraw').change(function() {
    var sorting = () => {};
    if($('.sort-withdraw').val() === 'Price Descending') {
      sorting = (a, b) => {
        return Number($(b).find('.price').text().replace(' keys', '')) - Number($(a).find('.price').text().replace(' keys', ''));
      };
    } else if($('.sort-withdraw').val() === 'Price Ascending') {
      sorting = (a, b) => {
        return Number($(a).find('.price').text().replace(' keys', '')) - Number($(b).find('.price').text().replace(' keys', ''));
      };
    } else if($('.sort-withdraw').val() === 'Name A-Z') {
      sorting = (a, b) => {
        return $(a).find('.name').text().localeCompare($(b).find('.name').text());
      };
    }
    var $items = $('.withdraw-modal .items');
    var $itemsitem = $items.find('.item');
    $itemsitem.sort(sorting);
    $itemsitem.detach().appendTo($items);
  });

  $('.sort-deposit').change(function() {
    var sorting = () => {};
    if($('.sort-deposit').val() === 'Price Descending') {
      sorting = (a, b) => {
        return Number($(b).find('.price').text().replace(' keys', '')) - Number($(a).find('.price').text().replace(' keys', ''));
      };
    } else if($('.sort-deposit').val() === 'Price Ascending') {
      sorting = (a, b) => {
        return Number($(a).find('.price').text().replace(' keys', '')) - Number($(b).find('.price').text().replace(' keys', ''));
      };
    } else if($('.sort-deposit').val() === 'Name A-Z') {
      sorting = (a, b) => {
        return $(a).find('.name').text().localeCompare($(b).find('.name').text());
      };
    }
    var $items = $('.deposit-modal .items');
    var $itemsitem = $items.find('.item');
    $itemsitem.sort(sorting);
    $itemsitem.detach().appendTo($items);
  });


  $('.withdraw-modal .items').on('click', '.item .buy-item', function() {
    $('.buy-modal').data('bot-id', $(this).parent().data('bot-id'));
    $('.buy-modal').data('asset-id', $(this).parent().data('asset-id'));
  });
  $(document).on('confirmation', '.buy-modal', function() {
    let botid = $('.buy-modal').data('bot-id');
    let itemid = $('.buy-modal').data('asset-id');


    var tradeUrl = $('.withdraw-modal .trade-url input').val();
    var tradeUrlRegEx = /https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=[0-9]+&token=[A-z0-9-]+/;

    //https://steamcommunity.com/tradeoffer/new/?partner=104732495&token=pxpVsgJn
    if(!tradeUrlRegEx.test(tradeUrl)) {
      $('.trade-url input').addClass('invalid');
      setTimeout(function() {$('.trade-url input').removeClass('invalid');}, 600);
      return;
    }

    function getQueryParams(qs) {
      qs = qs.split('?')[1];
      qs = qs.split('+').join(' ');
      var params = {},
          tokens,
          re = /[?&]?([^=]+)=([^&]*)/g;
      while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
      }
      return params;
    }

    let token = getQueryParams(tradeUrl).token;
    $http.post('/api/tradeoffers/withdraw', {botID: botid, item: itemid, token: token});
  });

  $(document).on('confirmation', '.deposit-modal', function() {
    var tradeUrl = $('.deposit-modal .trade-url input').val();
    var tradeUrlRegEx = /https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=[0-9]+&token=[A-z0-9-]+/;

    //https://steamcommunity.com/tradeoffer/new/?partner=104732495&token=pxpVsgJn
    if(!tradeUrlRegEx.test(tradeUrl)) {
      $('.deposit-modal .trade-url input').addClass('invalid');
      setTimeout(function() {$('.deposit-modal .trade-url input').removeClass('invalid');}, 600);
      return;
    }

    function getQueryParams(qs) {
      qs = qs.split('?')[1];
      qs = qs.split('+').join(' ');
      var params = {},
          tokens,
          re = /[?&]?([^=]+)=([^&]*)/g;
      while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
      }
      return params;
    }

    window.localStorage.setItem('tradeUrl', tradeUrl);

    let token = getQueryParams(tradeUrl).token;

    var items = [];
    $('.deposit-modal .items .item.selected').each(function(idx, element) {
      items.push($(element).data('asset-id'));
    });

    if(items.length > 0) {
      $http.post('/api/tradeoffers/deposit', {items: items, token: token});
      depositModal.close();
    }
  });
};

angular.module('desktopApp')
  .controller('ItemsController', ItemsController);
