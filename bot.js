const fs = require('fs');
const Keyv = require('keyv');
const Discord = require('discord.js');
const config = require('./private/config.json');

const client = new Discord.Client();
const prefix = 'f!';
const version = 'v0.3.2';
const devAccessArray = ['461564949768962048'];

client.addons = new Discord.Collection();
const addonFiles = fs.readdirSync('./addons').filter(file => file.endsWith('.js'));
for (const file of addonFiles) {
    const addon = require(`./addons/${file}`);
    client.addons.set(addon.command, addon);
};

const guildModRole = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'modRole' } );
const guildThreadRole = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'threadRole' } );
const guildThreadCategory = new Keyv('sqlite://private/models/GuildSettings.sqlite', { namespace: 'threadCategories' } );

client.once('ready', () => {
    if (client.shard) {
        console.log(`Shard ${client.shard.ids} started running version: ${version}`);
    } else {
        console.log(`ForoBot started running version: ${version}`);
    };
    client.user.setActivity('f!help', {type: 'WATCHING'});
});

client.on('guildCreate', (guild) => {
    if (guild.me.permissions.has('ADMINISTRATOR')) {
        return
    };
    guild.leave();
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

async function handle(message) {
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (client.addons.has(command)) {
        const addon = client.addons.get(command);
        if (addon.version !== '1') {
            return message.channel.send(':no_entry: This addon is outdated and needs to be updated by it\'s developer. If you can reach out to them, make sure to let them know!')
        };
        try {
            addon.execute(message, args);
        } catch (error) {
            console.error(error);
            message.channel.send(':no_entry: The addon function failed.');
        };
        return
    };
    if (command == 'help') {
        helpCommand(message, args);
    } else if (command == 'id') {
        channelID(message, args);
    } else if (command == 'thread') {
        threadCommand(message, args);
    } else if (command == 'settings') {
        settingsCommand(message, args);
    } else if (command == 'database') {
        databaseCommand(message, args);
    } else if (command == 'dev') {
        devFunctions(message, args);
    } else {
        message.channel.send(':no_entry: Not a valid command. Use `f!help` to see all available commands.');
    };
};

function helpCommand(message, args) {
    if (!args[0] && devAccessArray.includes(message.author.id)) {
        const embed = new Discord.MessageEmbed()
            .setColor('#00dd00')
            .setTimestamp()
            .setAuthor('ForoBot Developer Help Menu',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
            .setDescription('This is the help menu.')
            .addFields(
                {name:'`f!dev`',value:'Type `f!help dev` for the developer help menu.'},
                {name:'`f!database`',value:'Type `f!help database` for the database help menu.'},
                {name:'`f!threads`',value:'Type `f!help threads` for the threads help menu.'},
                {name:'`f!settings`',value:'Type `f!help settings` for the settings help menu.'},
                {name:'`f!id`',value:'This command allows you to check the ID of a channel or a category.'}
            )
            .setFooter(`ForoBot Help Menu (${message.author.tag})`);
        return message.channel.send(embed);
    };
    if (args[0] == 'thread') {
        const embed = new Discord.MessageEmbed()
            .setColor('#00dd00')
            .setTimestamp()
            .setAuthor('ForoBot Help Menu',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
            .setDescription('This is the thread help menu. Some of these commands could be restricted to certain roles.\nIf a command is restricted to the thread role, it will include `(TR)` in the title.\nIf a command is restricted to the moderator role, it will include `(MR)` in the title.')
            .addFields(
                {name:'`f!thread`',value:'This is the prefix for all of these commands.'},
                {name:'`f!thread create {name}` (TR)',value:'Creates a thread. Access the new channel and start typing your new thread.'},
                {name:'`f!thread publish` (TR)',value:'Publishes a thread. Once a thread is published, anyone can read it and anyone can start replying to it.'},
                {name:'`f!thread delete` (MR)',value:'Deletes a thread. Once a thread is deleted, nobody can read it and the content is not saved anywhere. This command can also be used by the thread starter.'},
                {name:'`f!thread lock` (MR)',value:'Locks a thread. Once a thread is locked, anyone can read it but nobody can reply to it.'},
                {name:'`f!thread unlock` (MR)',value:'Unlocks a thread. Once a thread is unlocked, anyone can read it and reply to it.'},
                {name:'`f!thread archive` (MR)',value:'Removes a thread from public view, and only allows members with the moderator role to read and respond to it.'},
                {name:'`f!thread unarchive` (MR)',value:'Returns a thread from hidden view, and allows all members to read and respond to it.'}
            )
            .setFooter(`ForoBot Help Menu (${message.author.tag})`);
        return message.channel.send(embed);
    };
    if (args[0] == 'settings') {
        const embed = new Discord.MessageEmbed()
            .setColor('#00dd00')
            .setTimestamp()
            .setAuthor('ForoBot Help Menu',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
            .setDescription('This is the settings help menu.')
            .addFields(
                {name:'`f!settings`',value:'This is the prefix for all of these commands.'},
                {name:'`f!settings threadrole`',value:'Modifies the role required to make threads. To set this, a member requires the `Manage Server` permission.'},
                {name:'`f!settings threadcategory`',value:'Modifies the category where threads are created. To set this, a member requires the `Manage Server` permission.'},
                {name:'`f!settings modrole`',value:'Modifies the role required to perform moderation actions. To set this, a member requires the `Manage Server` permission.'}
            )
            .setFooter(`ForoBot Help Menu (${message.author.tag})`);
        return message.channel.send(embed);
    }
    if (devAccessArray.includes(message.author.id) && args[0] == 'database') {
        const embed = new Discord.MessageEmbed()
            .setColor('#00dd00')
            .setTimestamp()
            .setAuthor('ForoBot Developer Help Menu (`f!database`)',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
            .setDescription('This is the database help menu.')
            .addFields(
                {name:'`f!database`',value:'This is the main command. Database commands start with `f!database`. Other developer commands can be seen with `f!help dev`.'},
                {name:'`f!database view <database> <guild ID>`',value:'This command allows you to view data from the databases.'},
                {name:'`f!database modify add <database> <value 1 (guild ID)> <value 2 (role/channel ID)>`',value:'This command allows you to edit data in a database.'},
                {name:'`f!database modify remove <database> <value 1 (guild ID)>`',value:'This command allows you to remove data from a database.'},
                {name:'Databases:',value:'These are the databases that are usable within the commands.\n - `threadcategory`\n - `threadrole`\n - `modrole`'})
            .setFooter(`ForoBot Help Menu (${message.author.tag})`);
        return message.channel.send(embed);
    };
    if (devAccessArray.includes(message.author.id) && args[0] == 'dev') {
        const embed = new Discord.MessageEmbed()
            .setColor('#00dd00')
            .setTimestamp()
            .setAuthor('ForoBot Developer Help Menu (`f!dev`)',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
            .setDescription('This is the dev help menu.')
            .addFields(
                {name:'`f!dev`',value:'This is the main command. Most developer commands start with `f!dev`, unless they interact with the database. Database commands can be seen with `f!help database`.'},
                {name:'`f!dev channels`',value:'This command allows you to add and remove channels from a server, which is a good tool for support. Running the command will allow you to see the subfunctions of it.'},
                {name:'`f!dev messages`',value:'This command allows you to send, edit, and delete messages from a channel or using the message ID. Running the command will allow you to see the subfunctions of it.'},
                {name:'`f!dev access`',value:'This command allows you to add and remove ID\'s from the developer users, as well as locking the access completely. Running the command will allow you to see the subfunctions of it.'},
                {name:'`f!dev debug`',value:'This command allows you to run debug codes, and can run methods as well. Incorrect usage can crash the bot, which is why this command can only be run by developers.'})
            .setFooter(`ForoBot Help Menu (${message.author.tag})`);
        return message.channel.send(embed);
    };
    const embed = new Discord.MessageEmbed()
        .setColor('#00dd00')
        .setTimestamp()
        .setAuthor('ForoBot Help Menu',client.user.avatarURL({dynamic: true, format: "png", size: 64}))
        .setDescription('This is the help menu.')
        .addFields(
            {name:'`f!thread`',value:'Type `f!help thread` for the threads help menu.'},
            {name:'`f!settings`',value:'Type `f!help settings` for the settings help menu.'},
            {name:'`f!id`',value:'This command allows you to check the ID of a channel or a category.'}
        )
        .setFooter(`ForoBot Help Menu (${message.author.tag})`);
    return message.channel.send(embed);
};

async function threadCommand(message, args) {
    if (args[0] == 'create') { // Create a thread
        const threadRoleID = await guildThreadRole.get(message.guild.id);
        const threadRole = message.guild.roles.cache.get(threadRoleID);
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!threadRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread role using `f!settings threadrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the moderator role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(threadRoleID)) {
            return message.channel.send(':no_entry: Performing this action requires the role with name: `' + threadRole.name + '`.');
        };
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        if (!threadCategory) {
            return message.channel.send(':no_entry: A server administrator must set the thread category using `f!settings threads <category ID>` before this command can be used.');
        };
        if (!threadCategory.manageable) {
            return message.channel.send(':no_entry: Thread couldn\'t be created due to the bot lacking permissions in the set guild thread category.');
        };
        if (!args[1]) {
            return message.channel.send(':no_entry: Correct command syntax: `f!thread create <title>`');
        };
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
                    allow: ['SEND_MESSAGES','VIEW_CHANNEL','READ_MESSAGE_HISTORY'],
                },
                {
                    id: message.guild.roles.everyone.id,
                    deny: ['SEND_MESSAGES','VIEW_CHANNEL','READ_MESSAGE_HISTORY'],
                },
                {
                    id: modRole.id,
                    allow: ['SEND_MESSAGES','VIEW_CHANNEL','READ_MESSAGE_HISTORY','MANAGE_MESSAGES'],
                },
            ],
            reason: `Thread created by member ${message.author.tag}.`
        }).catch(console.error);
        return message.channel.send(':white_check_mark: Successfully created a new thread.');
    } else if (args[0] == 'delete') { // Deletes a thread
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        const threadCreator = message.channel.topic.split(' ');
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!threadCategory) {
            return message.channel.send(':no_entry: A server administrator must set the thread role using `f!settings threadcategory <category ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the moderator role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (message.channel.parentID !== threadCategory.id) {
            return message.channel.send(':no_entry: This command can only be used in threads.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (threadCreator[0] == message.author.id || message.member.roles.cache.has(modRole.id)) {
            if (!args[1]) {
                return message.channel.send(':no_entry: A reason is required. Syntax: `f!thread delete <reason>`.').then(m => m.delete({timeout: 5000}) && message.delete());
            };
            args.shift();
            const reason = args.join(' ');
            message.channel.delete(`${reason} (${message.author.tag})`);
        } else {
            return message.channel.send(':no_entry: To delete a thread you must either have the moderator role or be the thread creator.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
    } else if (args[0] == 'publish') { // Publishing a thread
        const threadCategoryID = await guildThreadCategory.get(message.guild.id);
        const threadCategory = message.guild.channels.cache.get(threadCategoryID);
        const threadRoleID = await guildThreadRole.get(message.guild.id);
        const threadRole = message.guild.roles.cache.get(threadRoleID);
        if (!threadCategory) {
            return message.channel.send(':no_entry: A server administrator must set the thread role using `f!settings threadrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!threadRole) {
            return message.channel.send(':no_entry: A server administrator must set the moderator role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (message.channel.parentID !== threadCategory.id) {
            return message.channel.send(':no_entry: This command can only be used in threads you created.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(threadRole.id)) {
            return message.channel.send(':no_entry: You no longer have the role required to create threads. This thread will be deleted.').then(m => m.channel.delete('Thread deleted due to lack of thread role.')).catch(console.error);
        };
        const threadCreator = message.channel.topic.split(' ');
        if (message.author.id !== threadCreator[0]) {
            return message.channel.send(':no_entry: This command can only be used in threads you created.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.channel.permissionOverwrites.has(threadCreator[0])) {
            return message.channel.send(':no_entry: This thread is already published.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        await message.channel.messages.cache.filter(m => m.author.id = threadCreator[0]).forEach(m => m.pin());
        await message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
        });
        await message.channel.permissionOverwrites.get(threadCreator[0]).delete();
        return message.channel.send(':white_check_mark: Thread successfully published.').then(m => m.delete({timeout: 5000}) && message.delete());
    } else if (args[0] == 'lock') { // Locks a thread
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread mod role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(modRole.id)) {
            return message.channel.send(':no_entry: To perform this command, you require the role `' + modRole.name + '`.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        const threadCategory = await guildThreadCategory.get(message.guild.id);
        if (message.channel.parent.id !== threadCategory)  {
            return message.channel.send(':no_entry: This can only be used in threads.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!args[1]) {
            return message.channel.send(':no_entry: Provide a reason for locking the thread.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        args.shift();
        const reason = args.join(' ');
        await message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false,
            READ_MESSAGE_HISTORY: true,
        });
        return message.channel.send('Thread locked by `' + message.author.tag + '`.\n\nReason: ' + reason).then(message.delete()).catch(console.error);
    } else if (args[0] == 'unlock') { // Unlocks a thread
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread mod role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(modRole.id)) {
            return message.channel.send(':no_entry: To perform this command, you require the role `' + modRole.name + '`.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        const threadCategory = await guildThreadCategory.get(message.guild.id);
        if (message.channel.parent.id !== threadCategory)  {
            return message.channel.send(':no_entry: This can only be used in threads.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!args[1]) {
            return message.channel.send(':no_entry: Provide a reason for unlocking the thread.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        args.shift();
        const reason = args.join(' ');
        await message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
        });
        return message.channel.send('Thread unlocked by `' + message.author.tag + '`.\n\nReason: ' + reason).then(message.delete()).catch(console.error);
    } else if (args[0] == 'archive') {
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread mod role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(modRole.id)) {
            return message.channel.send(':no_entry: To perform this command, you require the role `' + modRole.name + '`.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        const threadCategory = await guildThreadCategory.get(message.guild.id);
        if (message.channel.parent.id !== threadCategory)  {
            return message.channel.send(':no_entry: This can only be used in threads.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        await message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: false,
            SEND_MESSAGES: false,
            READ_MESSAGE_HISTORY: false,
        });
        return message.channel.send(':white_check_mark: Successfully archived this thread, removing it from public view.').then(m => m.delete({timeout: 5000}) && message.delete()).catch(console.error);
    } else if (args[0] == 'unarchive') {
        const modRoleID = await guildModRole.get(message.guild.id);
        const modRole = message.guild.roles.cache.get(modRoleID);
        if (!modRole) {
            return message.channel.send(':no_entry: A server administrator must set the thread mod role using `f!settings modrole <role ID>` before this command can be used.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        if (!message.member.roles.cache.has(modRole.id)) {
            return message.channel.send(':no_entry: To perform this command, you require the role `' + modRole.name + '`.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        const threadCategory = await guildThreadCategory.get(message.guild.id);
        if (message.channel.parent.id !== threadCategory)  {
            return message.channel.send(':no_entry: This can only be used in threads.').then(m => m.delete({timeout: 5000}) && message.delete());
        };
        await message.channel.updateOverwrite(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            READ_MESSAGE_HISTORY: true,
        });
        return message.channel.send(':white_check_mark: Successfully unarchived this thread, adding it back to public view.').then(m => m.delete({timeout: 5000}) && message.delete()).catch(console.error);
    } else {
        return message.channel.send(':no_entry: Please use an available subcommand:\n - `create`\n - `publish`\n - `delete`\n - `lock`\n - `unlock`\n - `archive`\nSyntax: `f!thread <subcommand>`.').then(m => m.delete({timeout: 5000}) && message.delete());
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
                return message.channel.send(':no_entry: Set a thread role using `f!settings threadrole <role ID>`.');
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
        const debugArray = args;
        debugArray.shift();
        const debug = debugArray.join(' ');
        try {
            let evaled = await eval(debug);
            console.log(evaled);
            return message.channel.send(`Return value:\n\`\`\`${evaled}\`\`\``);
        } catch (err) {
            return console.error(err);
        };
    };
    if (args[0] == 'shard') {
        if (!client.shard) {
            return message.channel.send(':no_entry: The bot isn\'t running from a shardManager.');
        };
        const shardID = client.shard.ids;
        const shardGuilds = await client.shard.fetchClientValues('guilds.cache.size');
        return message.channel.send(`Shard Info:\n - Shard ID: \`${shardID}\`\n - Shard Guilds: \`${shardGuilds}\`\n - Total Shards: \`${client.shard.count}\``);
    };
    return message.channel.send(':no_entry: Invalid function. Valid functions:\n - `channels`\n - `messages`\n - `access`\n - `debug`\n - `shard`\nSyntax: `f!dev <function>`.');
};

async function databaseCommand (message, args) {
    if (!devAccessArray.includes(message.author.id)) {
        return message.channel.send(':no_entry: Using this command requires developer access.');
    };
    if (!args[0]) {
        return message.channel.send(':no_entry: Unknown subcommand. Please run `f!help database` to view all valid subcommands.');
    };
    if (args[0] == 'read' || args[0] == 'view') {
        if (!args[1]) {
            return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database read <database> [server ID]`.\nValid databases: `threadcategory`, `threadrole`, `modrole`.');
        };
        if (args[1] == 'threadcategory') {
            if (args[2]) {
                const guildID = args[2];
                const threadCategory = await guildThreadCategory.get(guildID);
                const category = await client.channels.cache.get(threadCategory);
                if (!category) {
                    return message.channel.send(':no_entry: This server does not have a thread category set, or it is invalid.');
                };
                return message.channel.send(`Guild thread category ID: \`${category.id}\` (Name: \`${category.name}\`).`);
            } else  {
                const threadCategory = await guildThreadCategory.get(message.guild.id);
                const category = await message.guild.channels.cache.get(threadCategory);
                if (!category) {
                    return message.channel.send(':no_entry: This server does not have a thread category set, or it is invalid.');
                };
                return message.channel.send(`Guild thread category ID: \`${category.id}\` (Name: \`${category.name}\`).`);
            };
        };
        if (args[1] == 'threadrole') {
            if (args[2]) {
                const guildID = args[2];
                const threadRole = await guildThreadRole.get(guildID);
                const guild = await client.guilds.cache.get(guildID);
                if (!guild) {
                    return message.channel.send(':no_entry: Invalid guild ID.');
                };
                const role = await guild.roles.cache.get(threadRole);
                if (!role) {
                    return message.channel.send(':no_entry: This server does not have a thread role set, or it is invalid.');
                };
                return message.channel.send(`Guild thread role ID: \`${role.id}\` (Name: \`${role.name}\`).`);
            } else {
                const threadRole = await guildThreadRole.get(message.guild.id);
                const role = await message.guild.roles.cache.get(threadRole);
                if (!role) {
                    return message.channel.send(':no_entry: This server does not have a thread role set, or it is invalid.');
                };
                return message.channel.send(`Guild thread role ID: \`${role.id}\` (Name: \`${role.name}\`).`);
            };
        };
        if (args[1] == 'modrole') {
            if (args[2]) {
                const guildID = args[2];
                const modRole = await guildModRole.get(guildID);
                const guild = await client.guilds.cache.get(guildID);
                if (!guild) {
                    return message.channel.send(':no_entry: Invalid guild ID.');
                };
                const role = await guild.roles.cache.get(modRole);
                if (!role) {
                    return message.channel.send(':no_entry: This server does not have a mod role set, or it is invalid.');
                };
                return message.channel.send(`Guild mod role ID: \`${role.id}\` (Name: \`${role.name}\`).`);
            } else {
                const threadRole = await guildModRole.get(message.guild.id);
                const role = await message.guild.roles.cache.get(threadRole);
                if (!role) {
                    return message.channel.send(':no_entry: This server does not have a mod role set, or it is invalid.');
                };
                return message.channel.send(`Guild mod role ID: \`${role.id}\` (Name: \`${role.name}\`).`);
            };
        };
        return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database read <database> [server ID]`.\nValid databases: `threadcategory`, `threadrole`, `modrole`.')
    };
    if (args[0] == 'modify') {
        if (!args[1]) {
            return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify <add/remove>`');
        };
        if (args[1] == 'add') {
            if (!args[2]) {
                return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify add <database> <guild ID> <value>`\nValid databases: `threadcategory`, `threadrole`, `modrole`.');
            };
            if (args[2] == 'threadcategory') {
                if (!args[3] || !args[4]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify add threadcategory <guild ID> <value>`');
                };
                const value1 = args[3];
                const value2 = args[4];
                await guildThreadCategory.set(value1, value2).then(message.channel.send(`Successfully set the thread category for guild \`${value1}\` with value \`${value2}\`.`)).catch(console.error);
                return
            };
            if (args[2] == 'threadrole') {
                if (!args[3] || !args[4]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify add threadrole <guild ID> <value>`');
                };
                const value1 = args[3];
                const value2 = args[4];
                await guildThreadRole.set(value1, value2).then(message.channel.send(`Successfully set the thread role for guild \`${value1}\` with value \`${value2}\`.`)).catch(console.error);
                return
            };
            if (args[2] == 'modrole') {
                if (!args[3] || !args[4]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify add modrole <guild ID> <value>`');
                };
                const value1 = args[3];
                const value2 = args[4];
                await guildModRole.set(value1, value2).then(message.channel.send(`Successfully set the mod role for guild \`${value1}\` with value \`${value2}\`.`)).catch(console.error);
                return
            };
            return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify add <database> <guild ID> <value>`\nValid databases: `threadcategory`, `threadrole`, `modrole`.');
        };
        if (args[1] == 'remove') {
            if (!args[2]) {
                return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify remove <database> <guild ID>`\nValid databases: `threadcategory`, `threadrole`, `modrole`.');
            };
            if (args[2] == 'threadcategory') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify remove threadcategory <guild ID>`');
                };
                const value1 = args[3];
                await guildThreadCategory.delete(value1).then(message.channel.send(`Successfully deleted the thread category for guild \`${value1}\`.`)).catch(console.error);
                return
            };
            if (args[2] == 'threadrole') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify remove threadrole <guild ID>`');
                };
                const value1 = args[3];
                await guildThreadRole.delete(value1).then(message.channel.send(`Successfully deleted the thread role for guild \`${value1}\`.`)).catch(console.error);
                return
            };
            if (args[2] == 'modrole') {
                if (!args[3]) {
                    return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify remove modrole <guild ID>`');
                };
                const value1 = args[3];
                await guildModRole.delete(value1).then(message.channel.send(`Successfully deleted the thread role for guild \`${value1}\`.`)).catch(console.error);
                return
            };
            return message.channel.send(':no_entry: Invalid syntax. Correct syntax: `f!database modify remove <database> <guild ID>`\nValid databases: `threadcategory`, `threadrole`, `modrole`.');
        };
    };
    return message.channel.send(':no_entry: Unknown subcommand. Please run `f!help database` to view all valid subcommands.');
};
client.login(config.token);