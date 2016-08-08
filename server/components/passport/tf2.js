'use strict';

const request = require('request');
const fs = require('fs');
var util = require('util');
var blacklisted = require('./blacklist.js');
var cache = require('rediscache');
var _ = require('underscore');

// custom cache connect method for testing
if(process.env.NODE_ENV === 'test') {
  cache.client = require('redis-mock').createClient();
} else {
  if (process.env.REDIS_PORT_6379_TCP_ADDR) {
    cache.client = require("redis").createClient(process.env.REDIS_PORT_6379_TCP_PORT, process.env.REDIS_PORT_6379_TCP_ADDR);
    if(process.env.REDIS_PORT_6379_TCP_PORT !== undefined) {
      cache.client.auth(process.env.REDIS_PASSWORD);
    }
  } else {
    cache.client = require("redis").createClient();
  }
}

cache.configure({
  expiry: 30
});
var APIKEY = '';
var priceData;

var hrstart = process.hrtime();
if(!fs.existsSync('priceData.dat')) {
  request('http://backpack.tf/api/IGetPrices/v4/?key=56044881dea9e917538b45f1', function(err, res, body) {
    if(err) {
      return;
    }
    var jsonParsedBody = JSON.parse(body);
    if(jsonParsedBody.response.success === 1) {
      priceData = jsonParsedBody;
      fs.writeFileSync('priceData.dat', body);
      console.log("Got price data!");
    } else {
      console.log("Loaded price data!");
      priceData = JSON.parse(fs.readFileSync('priceData.dat'));
    }
  })
} else {
  console.log("Loaded price data!");
  priceData = JSON.parse(fs.readFileSync('priceData.dat'));
}

function getInventory(steamID, callback, options) {
  options = _.extend({skipCache: false}, options)
  if(options.skipCache === false) {
    cache.fetch('inventorycache' + steamID).otherwise(function(deferred, cacheKey) {
      if(!priceData) {console.log("Tried to get inventory before loading price data"); return;}
      request({
        url: 'http://steamcommunity.com/profiles/' + steamID + '/inventory/json/440/2',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36'
        },
        gzip: true
      }, function(err, res, body) {
        let items = {};
        if(body === undefined || body.startsWith('<')) {
          deferred.reject("Couldn't get inventory from steam.", {});
          return;
        }
        var bodyJSON = {};
        var failed = false;
        try {
          bodyJSON = JSON.parse(body);
        } catch(err) {
          deferred.reject("Couldn't get inventory from steam.", {});
          bodyJSON = {};
          failed = true;
        } finally {
          if(failed) {
            return;
          }
        }
        if(!bodyJSON) {
          deferred.reject("Couldn't get inventory from steam.", {});
          return;
        }
        for(let itemIndex in bodyJSON.rgInventory) {
          if(!bodyJSON.rgInventory.hasOwnProperty(itemIndex)) {
            continue;
          }
          let item = bodyJSON.rgInventory[itemIndex];
          let itemInfo = bodyJSON.rgDescriptions[item.classid + "_" + item.instanceid];
          itemInfo.id = item.id;
          if(itemInfo.descriptions) {
            itemInfo.descriptions.forEach((description) => {
              if(description.value === "( Not Usable in Crafting )") {
                itemInfo.craftable = false;
              } else {
                itemInfo.craftable = true;
              }
            })
          }
          items[item.id] = {
            steamid: steamID,
            assetid: item.id,
            appid: itemInfo.appid,
            classid: itemInfo.classid,
            instanceid: itemInfo.instanceid,
            icon_url: itemInfo.icon_url,
            icon_url_large: itemInfo.icon_url_large,
            market_hash_name: itemInfo.market_hash_name,
            type: itemInfo.type,
            app_data: itemInfo.app_data,
            tradable: itemInfo.tradable,
            craftable: 'Craftable',
            attributes: {}
          };
          if(!itemInfo.craftable) {
            items[item.id].craftable = 'Non-Craftable'
          }
        }
        request('http://api.steampowered.com/IEconItems_440/GetPlayerItems/v0001/?SteamID=' + steamID + '&key=29C1ABCF682442DDCD8207890A2D658D', function(err, res, body) {
          if(err || body.startsWith('<') || !body || JSON.parse(body).result === undefined) {
            return;
          }
          let bodyJSON = JSON.parse(body).result.items;
          if(!bodyJSON) {
            return;
          }
          var numItems = 0;
          for(let item of bodyJSON) {
            if(items[item.id] !== undefined) {
              items[item.id].attributes = item.attributes;
              let shouldAllow = true;
              blacklisted.blacklisted.forEach(function(itemName) {
                if(items[item.id] === undefined || items[item.id].market_hash_name.indexOf(itemName) > -1) {
                  shouldAllow = false;
                }
              });
              var modifier = 1.0;

              for(let modifierProp in options) {
                if(options.hasOwnProperty(modifierProp) && items[item.id].market_hash_name.toLowerCase().indexOf(modifierProp) > -1) {
                  modifier *= options[modifierProp];
                }
              }

              // if(items[item.id].market_hash_name.toLowerCase().indexOf('unusual') > -1) {
              //   modifier *= 0.8;
              // }

              let fixedName = items[item.id].market_hash_name.replace('Unusual ', '').replace('Strange ', '').replace('The ', '').replace('Specialized ', '').replace('Genuine ', '');
              if(priceData.response.items === undefined) {
                deferred.reject("Could not load items!");
                return;
              }
              let priceOfItem = priceData.response.items[fixedName];
              let priceIndex = 0;
              if(item.attributes && priceOfItem) {
                for(let attribute of item.attributes) {
                  if(attribute.defindex === 134) {
                    priceIndex = attribute.float_value;
                  }
                }
              }
              if(shouldAllow && priceOfItem && items[item.id].tradable &&
                 priceOfItem.prices[items[item.id].app_data.quality] &&
                 priceOfItem.prices[items[item.id].app_data.quality].Tradable &&
                 priceOfItem.prices[items[item.id].app_data.quality].Tradable[items[item.id].craftable] &&
                 priceOfItem.prices[items[item.id].app_data.quality].Tradable[items[item.id].craftable][priceIndex]) {
                items[item.id].price = priceOfItem.prices[items[item.id].app_data.quality].Tradable[items[item.id].craftable][priceIndex];
                numItems += 1;
                if(items[item.id].price && items[item.id].price.currency === 'hat') {
                  items[item.id].price.currency = 'metal'
                  items[item.id].metal = true;
                }
                if(items[item.id].price && items[item.id].price.currency === 'usd') {
                  items[item.id].price.currency = 'metal'
                  items[item.id].price.value = items[item.id].price.value / 0.11
                  items[item.id].metal = true;
                }
                if(items[item.id].price && items[item.id].price.currency === 'metal') {
                  items[item.id].price.currency = 'keys'
                  items[item.id].price.value = items[item.id].price.value / 19
                }
                if(items[item.id].price && !items[item.id].price.modified) {
                  items[item.id].price.value *= modifier;
                  items[item.id].price.value = Math.round(items[item.id].price.value * 100) / 100;
                  items[item.id].price.modified = true;
                }
                if(items[item.id].price && items[item.id].price.value < 0.25 || items[item.id].price.value > 80) {
                  items[item.id].price = undefined;
                  delete items[item.id];
                }
              } else {
                delete items[item.id];
              }
            }
          }
          deferred.resolve(items);
        })
      })
    }).then(function(items) {
      callback(null, items);
    }).fail(function(err) {
      callback(err);
    })
  }
}

module.exports = getInventory;
