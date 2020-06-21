# ForoBot
These are the files for my discord.js bot software, called ForoBot. It's main purpose is to replicate a forum software inside of discord itself, while still maintaining a clean discord experience.
# Installation
If you are interested in using this software in your bot, there is a bit of setup required.
Before you start, please have Node.js and npm installed on your computer, and have a bot application from: https://discord.com/developers/applications

Firstly, you should go to the releases section and download the latest stable release.

Secondly, you need to open a command prompt and using the `cd` command, you must navigate to the directory.
Once you are in the directory, it is time to download the dependancies. You will need to run:
 - `npm i discord.js`
 - `npm i keyv`
 - `npm i @keyv/sqlite`

Thirdly, you will to add a new folder that is normally hidden for security reasons.
Add a folder named "private", and inside it you will need 2 files. Inside, you will make another folder named "models", which will store the databases, and you will also need a file called "config.json".

In your "config.json" file, simply copy:
```json
{
    "token":"your-bot-token-here"
}
```
Replace "your-bot-token-here" with the token found under the bot section at https://discord.com/developers/applications.

Lastly, to start your bot, you will need to run the command `node bot.js` (or `node index.js` if you plan on using sharding, which runs the bot multiple times).

# Addons
An unique feature to running this bot software for yourself is that you can run addons, which are JavaScript files that contain an object with a new command. You can install any number of addons that you desire as well. Addons also overwrite existing commands, meaning you could create a "better" help command, or completely rewrite some existing commands to simplify it.

To install an addon, simply put the JavaScript file in the "addons" folder.

If you are interested in making an addon, here is a basic skeleton code that you can use:
```js
module.exports = {
    command: 'test', // This is the command trigger itself (i.e. 'f!test <args>').
    version: '1', // This is the format version, basically meaning that if I need to add more properties I can without worrying about addons crashing.
    execute(message, args) { // This is the actual code for the command. You should remember that you only have access to the 'message' object and the 'args' array. Here is what you can do with the message object: https://discord.js.org/#/docs/main/stable/class/Message
        if (args[0]) {
            return message.channel.send('Good job, you used a test command with arguments.');
        };
        return message.channel.send('Good job, you used a test command.');
    },
};
```
Other than that, this softwre is still in development. If you find any crashes, bugs, or well, anything unintended, please write a issue on GitHub and I will try to get them fixed.
