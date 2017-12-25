var Account = require('../models/account'),
    uuid    = require('uuid');

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
    command = command.toString().split(' ');

    if (!command[0]) {
        return;
    }

    const action = command.shift().toLowerCase();
    const params = command;

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
            params.unshift(action);
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
};