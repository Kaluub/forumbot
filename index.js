const config = require('./private/config.json');
const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { 
    token: config.token,
    totalShards: 6,
    shardList: [1,2,3]
});

manager.spawn(3);
manager.on('shardCreate', shard => console.log(`Shard created with ID: ${shard.id}`));