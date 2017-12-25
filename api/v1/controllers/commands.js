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

    Account.findOne({ username: playername }, { twitchId: 1, display_name: 1}, function(err, user) {
        if (err) {
            return socket.emit('command error', 'Invalid whisper target. The user does not exist.');
        }

        socket.broadcast.to(user.twitchId).emit('new message', {
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
    }
};