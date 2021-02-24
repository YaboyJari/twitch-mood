const testCommand = (target, client) => {
    console.log(target, 'Test worked!')
}

const COMMAND_LIST = [{
    command: '!test',
    function: testCommand,
}]

const handleCommands = (target, command, client) => {
    const getCommand = COMMAND_LIST.find(x => x.command === command);
    if (getCommand) {
        console.log(`* Command ${command} executed`);
        getCommand.function(target, client);
    } else {
        console.log(`* Unknown command ${command}`);
    }
}

module.exports = {
    handleCommands,
}