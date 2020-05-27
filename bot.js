const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./private/config.json');
const Keyv = require('keyv');
const prefix = 'f!';
const version = 'b0.3';
const devAccessArray = ['461564949768962048','460515032917344268'];

const guildModRole = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'modRole' } );
const guildThreadRole = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'threadRole' } );
const guildThreadCategory = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'threadCategories' } );

client.once('ready', () => {
	console.log('ForoBot Started running version: ' + version);
    client.user.setActivity('f!help', {type: 'WATCHING'})
});

client.on('guildCreate', (guild) => {
    if (guild.me.permissions.has('ADMINISTRATOR')) {
        return
    }
    guild.leave()
});

client.on('message', (message) => {
    if (message.author.bot) {
        return
	} else if (!message.guild.available) {
		return
    } else if (message.content.startsWith(prefix)) {
        handle(message);
    }
});

function handle(message) {
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    
    console.log('Command received: Command = ' + command + '. Arguments = ' + args + '. Sender: ' + message.author.tag + '.');

    if (command == 'help') {
        helpCommand(message, args)
    } else if (command == 'id') {
        channelID(message, args);
    } else if (command == 'thread') {
        threadCommand(message, args);
    } else if (command == 'settings') {
        settingsCommand(message, args);
    } else if (command == 'database') {
        debugDatabase(message, args);
    } else if (command == 'dev') {
        devFunctions(message, args);
    } else {
        message.channel.send(':no_entry: Not a valid command. Use `f!help` to see all available commands.');
    };
};

function helpCommand(message, args) {
    if (devAccessArray.includes(message.author.id)) {
        return
    };
    return
};

async function threadCommand(message, args) {
    if (args[0] == 'create') { // Create a thread
        const threadRoleID = await guildThreadRole.get(message.guild.id);
        const threadRole = message.guild.roles.cache.get(threadRoleID)
        const modRole = await guildModRole.get(message.guild.id);
        if (!threadRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread role using `f!settings role <role ID>` before this command can be used.');
        }
        if (!message.member.roles.cache.has(threadRoleID)) {
            return message.channel.send(':no_entry: Performing this action requires the role with name: `' + threadRole.name + '`.');
        }
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        if (!threadCategory) {
            return message.channel.send(':no_entry: A server administrator must set the thread category using `f!settings threads <category ID>` before this command can be used.');
        };
        if (!threadCategory.manageable) {
            return message.channel.send(':no_entry: Thread couldn\'t be created due to the bot lacking permissions in the set guild thread category.');
        }
        if (!args[1]) {
            return message.channel.send(':no_entry: Correct command syntax: `f!thread create <title>`')
        }
        args.shift();
        const title = args.join('-');
        message.guild.channels.create(title, {
            type: 'text',
            topic: `${message.author.id} (<@${message.author.id}>)`,
            parent: threadCategory,
            rateLimitPerUser: 30,
            permissionOverwrites: [
                {
                    id: message.author.id,
                    allow: ['SEND_MESSAGES','VIEW_CHANNEL'],
                },
                {
                    id: message.guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: modRole,
                    allow: ['SEND_MESSAGES','VIEW_CHANNEL','MANAGE_MESSAGES'],
                }
            ],
            reason: `Thread created by member ${message.author.tag}.`
        }).catch(console.error);
        return message.channel.send(':white_check_mark: Successfully created a new thread.');
    } else if (args[0] == 'publish') { // Publishing a thread
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        if (message.channel.parentID !== threadCategory.id) {
            return message.channel.send(':no_entry: This command can only be used in threads you created.');
        };
        const threadCreator = message.channel.topic.split(' ');
        if (threadCreator[0] !== message.author.id) {
            return message.channel.send(':no_entry: This command can only be used in threads you created.');
        };
        if (!message.channel.permissionOverwrites.has(threadCreator[0])) {
            return message.channel.send(':no_entry: This thread is already published.');
        };
        message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });
        message.channel.permissionOverwrites.get(threadCreator[0]).delete();
        message.channel.send(':white_check_mark: Thread successfully published.').then(message.delete())
    } else if (args[0] == 'lock') {
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread mod role using `f!settings modrole <role ID>` before this command can be used.')
        }
        if (!message.member.roles.cache.has(modRole.id)) {
            return message.channel.send(':no_entry: To perform this command, you require the role `' + modRole.name + '`.')
        }
        const threadCategory = await guildThreadCategory.get(message.guild.id);
        if (message.channel.parent.id !== threadCategory)  {
            return message.channel.send(':no_entry: This can only be used in threads.')
        }
        if (!args[1]) {
            return message.channel.send(':no_entry: Provide a reason for locking the thread.')
        }
        args.shift();
        const reason = args.join(' ')
        message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false,
        });
        message.channel.send('Thread locked by ' + message.author.tag + '.\n\nReason: ' + reason + '.')
    } else if (args[0] == 'delete') {
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        const threadCreator = message.channel.topic.split(' ');
        const modRole = await guildModRole.get(message.guild.id);
        if (message.channel.parentID !== threadCategory.id) {
            return
        }
        if (threadCreator[0] == message.author.id) {
            if (!args[1]) {
                return message.channel.send(':no_entry: A reason is required. Syntax: `f!thread delete <reason>`.')
            };
            args.shift();
            const reason = args.join(' ');
            message.channel.delete(`${reason} (<@${message.author.id}>)`);
        } else if (message.member.roles.cache.has(modRole)) {
            if (!args[1]) {
                return message.channel.send(':no_entry: A reason is required. Syntax: `f!thread delete <reason>`.')
            };
            args.shift();
            const reason = args.join(' ');
            message.channel.delete(reason);
        } else {
            return message.channel.send(':no_entry: To delete a thread you must either have the moderator role or be the thread creator.')
        };
    } else {
        return message.channel.send(':no_entry: Please use an available subcommand:\n - `create`\n - `publish`');
    };
};

async function settingsCommand(message, args) {
    if (args[0] == 'threads' || args[0] == 'thread') { // Changes the category where threads are made
        if (!message.member.permissions.has('MANAGE_SERVER')) {
            return message.channel.send(':no_entry: Performing this action requires the permission: `Manage Server`.');
        };
        if (!args[1]) {
            const category = await guildThreadCategory.get(message.guild.id);
            const categoryObject = message.guild.channels.cache.get(category)
            if (!categoryObject) {
                return message.channel.send(':no_entry: Set a log channel using `f!settings thread <category ID>`.');
            }
            return message.channel.send('Current thread category ID: `' + category + '` (Name: ' + categoryObject.name + ').');
        };
        const category = message.guild.channels.cache.get(args[1]);
        if (!category) {
            return message.channel.send(':no_entry: There is no category with this ID, or it cannot be seen by the bot due to permissions.');
        };
        if (category.type !== 'category') {
            return message.channel.send(':no_entry: The ID sent needs to be for a **category**.');
        };
        if (!category.manageable) {
            return message.channel.send(':no_entry: This category is not manageable by the bot due to permissions.');
        };
        await guildThreadCategory.set(message.guild.id, category.id);
        return message.channel.send(':white_check_mark: Successfully set the servers thread category to category named: `' + category.name + '`.\n\nThreads will be posted within this category.')
    } else if (args[0] == 'role' || args[0] == 'threadrole') { // Changes the role to create threads
        if (!message.member.permissions.has('MANAGE_SERVER')) {
            return message.channel.send(':no_entry: Performing this action requires the permission: `Manage Server`.');
        }
        if (!args[1]) {
            const role = await guildThreadRole.get(message.guild.id);
            const roleObject = message.guild.roles.cache.get(role)
            if (!roleObject) {
                return message.channel.send(':no_entry: Set a thread role using `f!settings role <role ID>`.');
            }
            return message.channel.send('Current thread role ID: `' + role + '` (Name: ' + roleObject.name + ').');
        }
        const role = message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.channel.send(':no_entry: There is no role with this ID.');
        }
        await guildThreadRole.set(message.guild.id, role.id);
        return message.channel.send(':white_check_mark: Successfully set the servers thread role to role named: `' + role.name + '`.\n\nIn order to create a new thread, a member will require this role.')
    } else if (args[0] == 'modrole') {
        if (!message.member.permissions.has('MANAGE_SERVER')) {
            return message.channel.send(':no_entry: Performing this action requires the permission: `Manage Server`.');
        };
        if (!args[1]) {
            const modrole = await guildModRole.get(message.guild.id);
            const modRoleObject = message.guild.roles.cache.get(modrole);
            if (!modRoleObject) {
                return message.channel.send(':no_entry: Set a moderator role using `f!settings modrole <role ID>`.');
            }
            return message.channel.send('Current moderator role ID: `' + modrole + '` (Name: ' + modRoleObject.name + ').');
        };
        const modrole = message.guild.roles.cache.get(args[1]);
        if (!modrole) {
            return message.channel.send(':no_entry: There is no role with this ID.');
        };
        await guildModRole.set(message.guild.id, modrole.id);
        return message.channel.send(':white_check_mark: Successfully set the servers mod role to role named: `' + modrole.name + '`.\n\nIn order to use moderation commands, a moderator will require this role.')
    } else {
        return message.channel.send(':no_entry: All settings:\n- `threads`\n- `role`\n- `modrole`\n\nTo use the settings command, type `f!settings <setting>`.');
    }
};

async function channelID(message, args) {
    if (args[0] == 'category') {
        const categoryID = message.channel.parentID;
        if (categoryID) {
            return message.channel.send(`The category ID that this channel is in is: \`${categoryID}\`.`);
        };
        return message.channel.send('This channel is not in a category.');
    } else if (args[0] == 'channel') {
        const channel = message.mentions.channels.first();
        if (channel) {
            return message.channel.send(`The channel ID is: \`${channel.id}\` (${channel.name}).`);
        };
        if (args[1]) {
            return message.channel.send(':no_entry: Correct syntax:\n- `f!id channel [channel]`\nBe sure to mention the channel (#channel name).');
        };
        return message.channel.send(`The channel ID is: \`${message.channel.id}\``);
    };
    return message.channel.send('This command checks the ID of any channel or of the category the channel is a part of.\n\nTo check a channel ID: `f!id channel [channel]`\nTo check the category ID: `f!id category`');
};

async function devFunctions(message, args) {
    if (!devAccessArray.includes(message.author.id)) {
        return message.channel.send(':no_entry: Using this command requires developer access.')
    };
    if (args[0] == 'channels') {
        if (args[1] == 'add') {
            if (!args[2] || !args[3]) {
                return message.channel.send(':no_entry: Parameters required (Syntax: `f!dev channels add <name> <guild id>`).')
            };
            const guild = client.guilds.cache.get(args[3]);
            if (!guild || !guild.available) {
                return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
            };
            const name = args[2]
            await guild.channels.create(name, {
                type: 'text',
            }).then(c => message.channel.send(`:white_check_mark: Successfully created a new channel with name: \`${c.name}\` (ID: \`${c.id}\`)`));
            return
        };
        if (args[1] == 'remove') {
            if (!args[2] || !args[3]) {
                return message.channel.send(':no_entry: Parameters required (Syntax: `f!dev channels remove <channel id> <guild id>`).')
            };
            const guild = client.guilds.cache.get(args[3]);
            if (!guild || !guild.available) {
                return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
            };
            const channel = guild.channels.cache.get(args[2]);
            if (!channel) {
                return message.channel.send(':no_entry: The guild exists however the channel could not be pulled.');
            };
            if (!channel.deletable) {
                return message.channel.send(':no_entry: This channel exists however the bot lacked permission to delete the channel.')
            };
            await channel.delete().then(c => message.channel.send(`:white_check_mark: Successfully deleted a channel with name: \`${c.name}\` (ID: \`${c.id}\`)`))
            return
        };
        if (args[1] == 'sweep') {
            if (args[2] == 'voice') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Provide a guild ID (Syntax: `f!dev channels sweep <type> <channel ID>`)');
                };
                const guild = client.guilds.cache.get(args[3]);
                if (!guild || !guild.available) {
                    return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
                };
                await guild.channels.cache.filter(c => c.type == 'voice' && c.deletable).forEach(c => c.delete(`Bulk channel delete performed by ${message.user.tag}.`).catch(console.error))
                return message.channel.send(`:white_check_mark: Successfully sweeped all voice channels from guild with ID: \`${guild.id}\`.`);
            };
            if (args[2] == 'text') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Provide a guild ID (Syntax: `f!dev channels sweep <type> <guild ID>`).');
                };
                const guild = client.guilds.cache.get(args[3]);
                if (!guild || !guild.available) {
                    return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
                };
                await guild.channels.cache.filter(c => c.type == 'text' && c.deletable).forEach(c => c.delete(`Bulk channel delete performed by ${message.user.tag}.`).catch(console.error))
                return message.channel.send(`:white_check_mark: Successfully sweeped all text channels from guild with ID: \`${guild.id}\`.`);
            };
            if (args[2] == 'category') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Provide a guild ID (Syntax: `f!dev channels sweep <type> <guild ID>`).');
                };
                const guild = client.guilds.cache.get(args[3]);
                if (!guild || !guild.available) {
                    return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
                };
                await guild.channels.cache.filter(c => c.type == 'category' && c.deletable).forEach(c => c.delete(`Bulk channel delete performed by ${message.user.tag}.`).catch(console.error))
                return message.channel.send(`:white_check_mark: Successfully sweeped all category channels from guild with ID: \`${guild.id}\`.`);
            };
            if (args[2] == 'all') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Provide a guild ID (Syntax: `f!dev channels sweep <type> <guild ID>`).');
                };
                const guild = client.guilds.cache.get(args[3]);
                if (!guild || !guild.available) {
                    return message.channel.send(':no_entry: Bot isn\'t in this guild, or the guild is unavailable.');
                };
                await guild.channels.cache.filter(c => c.deletable).forEach(c => c.delete(`Bulk channel delete performed by ${message.user.tag}.`).catch(console.error))
                return message.channel.send(`:white_check_mark: Successfully sweeped all category channels from guild with ID: \`${guild.id}\`.`);
            };
            return message.channel.send(':no_entry: Invalid type. Valid types:\n - `text`\n - `voice`\nSyntax: `f!dev channels sweep <type> <guild ID>`.')
        };
        return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `add`\n - `remove`\n - `sweep`\nSyntax: `f!dev channels <function>`.')
    };
    if (args[0] == 'messages') {
        if (args[1] == 'send') {
            if (!args[2] || !args[3]) {
                return message.channel.send(':no_entry: Provide a channel ID and a message. Syntax: `f!dev messages send <channel ID> <message>`');
            };
            const channel = client.channels.cache.get(args[2]);
            if (!channel) {
                return message.channel.send(':no_entry: Invalid channel ID recieved.');
            };
            var messageArray = args;
            messageArray.shift();
            messageArray.shift();
            messageArray.shift();
            const sendMessage = messageArray.join(" ");
            if (!sendMessage) {
                return message.channel.send(':no_entry: Invalid message sent.');
            }
            channel.send(sendMessage).then(m => message.channel.send(`:white_check_mark: Successfully sent a message to channel with ID: \`${channel.id}\` (Message ID: \`${m.id}\`).`)).catch(console.error)
            return
        };
        if (args[1] == 'edit') {
            if (!args[2] || !args[3] || !args[4]) {
                return message.channel.send(':no_entry: Provide a message ID and a message. Syntax: `f!dev messages edit <channel ID> <message ID> <edited message>`');
            };
            const channel = client.channels.cache.get(args[2]);
            if (!channel) {
                return message.channel.send(':no_entry: Invalid channel ID recieved.');
            };
            const oldMessage = await channel.messages.fetch(args[3]).catch(console.error);
            if (!oldMessage) {
                return message.channel.send(':no_entry: Invalid message ID recieved.');
            };
            if (oldMessage.editable == 'false') {
                return message.channel.send(':no_entry: The message exists however the bot couldn\'t edit it.')
            }
            var messageArray = args;
            messageArray.shift();
            messageArray.shift();
            messageArray.shift();
            messageArray.shift();
            const editedMessage = messageArray.join(" ");
            if (!editedMessage) {
                return message.channel.send(':no_entry: Invalid message sent.');
            };
            await oldMessage.edit(editedMessage).then(m => message.channel.send(`:white_check_mark: Successfully edited a message in channel with ID: \`${channel.id}\` (Message ID: \`${m.id}\`).`)).catch(console.error)
            return
        };
        return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `send`\nSyntax: `f!dev messages <function>`.')
    };
    if (args[0] == 'access') {
        if (args[1] == 'add') {
            if (!args[2]) {
                return message.channel.send(':no_entry: Provide a user ID.');
            };
            devAccessArray.push(args[2]);
            return message.channel.send(':white_check_mark: Successfully added `'+ args[2] +'` as a developer ID.');
        };
        if (args[1] == 'remove') {
            if (!args[2]) {
                return message.channel.send(':no_entry: Provide a user ID.');
            };
            if (!devAccessArray.includes(args[2])) {
                return message.channel.send(':no_entry: This user ID is not a developer.');
            };
            const index = devAccessArray.indexOf(args[2]);
            devAccessArray.splice(index);
            return message.channel.send(':white_check_mark: Successfully removed `'+ args[2] +'` as a developer ID.');
        };
        if (args[1] == 'lock') {
            devAccessArray.splice(0,devAccessArray.length,'461564949768962048');
            return message.channel.send(':white_check_mark: Successfully removed all developer access.')
        };
        return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `add`\n - `remove`\n - `lock`\nSyntax: `f!dev access <function>`.')
    };
    if (args[0] == 'debug') {
        if (!args[1]) {
            return message.channel.send(':no_entry: Provide a valid D.JS function to return.');
        };
        const debugArray = args
        debugArray.shift();
        const debug = debugArray.join(' ');
        try {
            let evaled = await eval(debug);
            console.log(evaled)
            return message.channel.send(`Return value:\n\`\`\`${evaled}\`\`\``);
        } catch (err) {
            return console.error
        };
    };
    return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `channels`\n - `messages`\n - `access`\n - `debug`\nSyntax: `f!dev <function>`.')
};

async function debugDatabase(message, args) {
    if (!devAccessArray.includes(message.author.id)) {
        return message.channel.send(':no_entry: Using this command requires developer access.')
    };
    if (args[0] == 'threadrole') {
        if (args[1]) {
            const role = await guildThreadRole.get(args[1]);
            const roleGuildObject = client.guilds.cache.get(args[1]);
            const roleObject = roleGuildObject.roles.cache.get(role).catch(message.channel.send(':no_entry: This guild ID doesn\'t exist.'));
            if (roleObject) {
                return message.channel.send('Thread role ID in database: `' + role + '`. Role name: `'+ roleObject.name + '`. Guild ID: `' + args[1] +'`.');
            };
            return message.channel.send('Thread role ID in database: `' + role + '`. Guild ID: `' + args[1] +'`.');
        };
        const role = await guildThreadRole.get(message.guild.id);
        return message.channel.send('Thread role ID in database: `' + role + '`.');
    } else if (args[0] == 'threadcategory') {
        if (args[1]) {
            const category = await guildThreadCategory.get(args[1]);
            const categoryGuildObject = client.guilds.cache.get(args[1]);
            const categoryObject = categoryGuildObject.channels.cache.get(category).catch(message.channel.send(':no_entry: This guild ID doesn\'t exist.'));
            if (categoryObject) {
                return message.channel.send('Thread category ID in database: `' + category + '`. Category name: `'+ categoryObject.name + '`. Guild ID: `' + args[1] +'`.');
            };
            return message.channel.send('Thread category ID in database: `' + category + '`. Guild ID: `' + args[1] +'`.');
        };
        const category = await guildThreadCategory.get(message.guild.id);
        return message.channel.send('Thread category ID in database: `' + category + '`.');
    } else if (args[0] == 'modrole') {
        if (args[1]) {
            const modRole = await guildModRole.get(args[1]);
            const modRoleGuildObject = client.guilds.cache.get(args[1])
            const modRoleObject = modRoleGuildObject.roles.cache.get(modRole)
            if (modRoleObject) {
                return message.channel.send('Thread moderator role ID in database: `' + modRole + '`. Role name: `'+ modRoleObject.name + '`. Guild ID: `' + args[1] +'`.');
            };
            return message.channel.send('Thread moderator role ID in database: `' + modRole + '`. Guild ID: `' + args[1] +'`.');
        };
        const modrole = await guildModRole.get(message.guild.id);
        return message.channel.send('Thread moderator role ID in database: `' + modrole + '`.');
    } else if (args[0] == 'add') {
        if (args[1] == 'threadrole') {
            if (args[2] && args[3]) {
                await guildThreadRole.set(args[2], args[3]);
                console.log(`Artificial addition to guildThreadRole database. Value 1: ${args[2]}. Value 2: ${args[3]}.`);
                return message.channel.send(`:white_check_mark: Successfully added value \`${args[2]}\` and value \`${args[3]}\` into the guildThreadRole database.`);
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            }
        } else if (args[1] == 'threadcategory') {
            if (args[2] && args[3]) {
                await guildThreadCategory.set(args[3], args[4]);
                console.log(`Artificial addition to guildThreadCategory database. Value 1: ${args[2]}. Value 2: ${args[3]}.`);
                return message.channel.send(`:white_check_mark: Successfully added value \`${args[2]}\` and value \`${args[3]}\` into the guildThreadCategory database.`);
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            }
        } else if (args[1] == 'modrole') {
            if (args[2] && args[3]) {
                await guildModRole.set(args[3], args[4]);
                console.log(`Artificial addition to guildModRole database. Value 1: ${args[2]}. Value 2: ${args[3]}.`);
                return message.channel.send(`:white_check_mark: Successfully added value \`${args[2]}\` and value \`${args[3]}\` into the guildModRole database.`);
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            };
        } else {
            return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `threadrole`\n - `threadcategory`\n - `modrole`\nSyntax: `f!database add <function>`.');
        };
    } else if (args[0] == 'remove') {
        if (args[1] == 'threadrole') {
            if (args[2]) {
                await guildThreadRole.delete(args[2]).catch(console.error);
                console.log(`Artificial substraction to guildThreadRole database. Value 1: ${args[2]}.`);
                return message.channel.send(`:white_check_mark: Successfully removed value \`${args[2]}\` from the guildThreadRole database.`);
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            };
        } else if (args[1] == 'threadcategory') {
            if (args[2]) {
                await guildThreadCategory.delete(args[2]).catch(console.error);
                console.log(`Artificial substraction to guildThreadCategory database. Value 1: ${args[2]}.`);
                return message.channel.send(`:white_check_mark: Successfully removed value \`${args[2]}\` from the guildThreadCategory database.`)
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            };
        } else if (args[1] == 'modrole') {
            if (args[2]) {
                await guildModRole.delete(args[2]).catch(console.error);
                console.log(`Artificial substraction to guildModRole database. Value 1: ${args[2]}.`);
                return message.channel.send(`:white_check_mark: Successfully removed value \`${args[2]}\` from the guildModRole database.`)
            } else {
                return message.channel.send(':no_entry: Insufficient values.');
            };
        } else {
            return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `threadrole`\n - `threadcategory`\n - `modrole`\nSyntax: `f!database remove <function>`.');
        };
    } else {
        return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `threadrole`\n - `threadcategory`\n - `modrole`\n - `add`\n - `remove`\nSyntax: `f!database <function>`.')
    };
};
client.login(config.token);