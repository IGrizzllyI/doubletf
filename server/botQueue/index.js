import redisq from 'redisq';
import EventEmitter from 'events';
import settings from './../config/bot';

var redis;

if(process.env.NODE_ENV === 'test') {
  redis = require('redis-mock').createClient();
} else {
  if (process.env.REDIS_PORT_6379_TCP_ADDR) {
    redis = require("redis").createClient(process.env.REDIS_PORT_6379_TCP_PORT, process.env.REDIS_PORT_6379_TCP_ADDR);

    if(process.env.REDIS_PASSWORD !== undefined) {
      redis.auth(process.env.REDIS_PASSWORD);
    }
  } else {
    redis = require("redis").createClient();
  }
}

redisq.options({redis: redis});

export class BotQueue extends EventEmitter {
  constructor(shouldReceive) {
    super();

    let self = this;
    this.queues = {};
    for(var botID of settings.bots) {
      this.queues[botID] = redisq.queue(botID);
    }
    this.serverQueue = redisq.queue('server');
    if(shouldReceive) {
      this.serverQueue.process(function(task, cb) {
        self.emit(task.task, task.data);
        cb(null);
      }, 1);
    }
  }

  addToQueue(botID, task, data) {
    if(this.queues[botID] !== undefined) {
      this.queues[botID].push({
        task: task,
        data: data
      })
    }
  }
}
