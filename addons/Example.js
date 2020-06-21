module.exports = {
    command: 'test',
    version: '1',
    execute(message, args) {
        if (args[0]) {
            return message.channel.send('Good job, you used a test command with arguments.');
        };
        return message.channel.send('Good job, you used a test command.');
    },
};