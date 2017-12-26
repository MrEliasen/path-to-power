const Account = require('../models/account');
const uuid    = require('uuid');
const GameMap = require('./map');

// Set from the init function
let Character;

function cmdHeal(io, socket, params, cmdSettings = {}) {
    // Get player position
    const position = socket.user.position;
    let healAmount = parseInt(params[0]);

    // Check if the healAmount is valid
    if (!healAmount || healAmount < 1) {
        return socket.emit('event feedback', 'Invalid heal amount!');
    }

    Character.getCharacter(socket.user.userId, function(character) {
        // Check if full health
        if (character.health === character.health_max) {
            return socket.emit('event feedback', 'You are already at full health!');
        }

        // Check if the heal would exceed 100%, if so, cap it.
        if ((character.health + healAmount) > character.health_max) {
           healAmount = character.health_max - character.health;
        }

        // Check if they have the money
        const price = healAmount * cmdSettings.cost;
        if (cmdSettings.cost && price > character.money) {
            return socket.emit('event feedback', 'You do not have enough money to heal that amount.');
        }

        // remove money and add health
        character.money = character.money - price;
        character.health = character.health + healAmount;

        Character.set(socket.user.userId, character, function(err) {
            socket.emit('event feedback', `You healed ${healAmount}, costing you ${price}`);
        });
    })
}

function cmdGlobal(io, socket, params) {
    io.emit('new message', {
        id: uuid(),
        action: 'global',
        display_name: socket.user.display_name,
        message: params.join(' ')
    });
}

function cmdWhisper(io, socket, params) {
    if (params.length < 2) {
        return socket.emit('command error', 'Invalid whisper. Syntax: /w <username> <message>');
    }

    const playername = params.shift().toLowerCase();

    Account.findOne({ username: playername }, { _id: 1, display_name: 1}, function(err, user) {
        if (err) {
            return socket.emit('command error', 'Invalid whisper target. The user does not exist.');
        }

        socket.broadcast.to(user._id).emit('new message', {
            id: uuid(),
            action: 'whisper-in',
            display_name: socket.user.display_name,
            message: params.join(' ')
        });

        socket.emit('new message', {
            id: uuid(),
            action: 'whisper-out',
            display_name: user.display_name,
            message: params.join(' ')
        });
    });
}

function cmdSay(io, socket, params) {
    const position = socket.user.position;
    let message = params.join(' ').trim();

    if (!message) {
        return socket.emit('command error', 'Unknown command.');
    }

    io.sockets.in(`grid_${position.mapId}_${position.x}_${position.y}`).emit('new message', {
        id: uuid(),
        action: 'local',
        display_name: socket.user.display_name,
        message: message
    });
}

exports.parse = function(io, socket, command) {
    command = command.toString().trim().split(' ');

    if (!command[0]) {
        return;
    }

    const action = command.shift().toLowerCase();
    const params = command;

    // Global commands, no grid restriction.
    switch(action) {
        case '/global':
        case '/g':
            return cmdGlobal(io, socket, params)
            break;

        case '/whisper':
        case '/w':
        case '/tell':
        case '/pm':
            return cmdWhisper(io, socket, params)
            break;

        case '/say':
        case '/s':
            // because the first word is removed from the command,
            // we put it back, since its considered part of the message
            return cmdSay(io, socket, params)
            break;

        default:
            if (action && action[0] !== '/') {
                // because the first word is removed from the command,
                // we put it back, since its considered part of the message
                params.unshift(action);
                return cmdSay(io, socket, params)
            }
            break;
    }

    // grid restricted command
    GameMap.checkCommandAvailable(action, socket.user.position, function(err, cmdSettings) {
        if (err) {
            return socket.emit('event feedback', 'Invalid command.');
        }

        switch (action) {
            case '/heal':
                return cmdHeal(io, socket, params, cmdSettings);
                break;
        }
    })
};

exports.init = function(characterController) {
    Character = characterController;
}