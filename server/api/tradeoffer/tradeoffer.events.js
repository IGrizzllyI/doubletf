/**
 * Tradeoffer model events
 */

'use strict';

import {EventEmitter} from 'events';
var Tradeoffer = require('../../sqldb').Tradeoffer;
var TradeofferEvents = new EventEmitter();

// Set max event listeners (0 == unlimited)
TradeofferEvents.setMaxListeners(0);

// Model events
var events = {
  'afterCreate': 'save',
  'afterUpdate': 'save',
  'afterDestroy': 'remove'
};

// Register the event emitter to the model events
for (var e in events) {
  var event = events[e];
  Tradeoffer.hook(e, emitEvent(event));
}

function emitEvent(event) {
  return function(doc, options, done) {
    TradeofferEvents.emit(event + ':' + doc._id, doc);
    TradeofferEvents.emit(event, doc);
    done(null);
  }
}

export default TradeofferEvents;
