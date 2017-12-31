import { CLIENT_NEW_MESSAGE } from './redux/types';
import { SERVER_TO_CLIENT, CLIENT_NEW_EVENT } from '../socket/redux/types';

import { getCharacterByName } from '../character/db/controller'

function cmdSay(socket, params) {
    const position = socket.user.position;
    let message = params.join(' ').trim();

    if (!message) {
        return [];
    }

    return [{
        type: CLIENT_NEW_EVENT,
        subtype: SERVER_TO_CLIENT,
        meta: {
            target: `grid_${position.mapId}_${position.x}_${position.y}`
        },
        payload: {
            type: 'local',
            name: socket.user.name,
            message: message
        }
    }];
}

function cmdWhisper(socket, params, callback) {
    if (params.length < 2) {
        callback([{
            type: CLIENT_COMMAND_ERROR,
            subtype: SERVER_TO_CLIENT,
            payload: 'Invalid whisper. Syntax: /w <username> <message>'
        }]);
    }

    const playername = params.shift();

    getCharacterByName(playername, function(err, character) {
        if (err) {
            return callback([err]);
        }

        if (!character) {
            return callback([{
                type: CLIENT_COMMAND_ERROR,
                subtype: SERVER_TO_CLIENT,
                payload: 'Invalid whisper target.'
            }]);
        }

        callback([{
            type: CLIENT_NEW_MESSAGE,
            subtype: SERVER_TO_CLIENT,
            meta: {
                target: character.user_id
            },
            payload: {
                type: 'whisper-in',
                name: socket.user.name,
                message: params.join(' ')
            }
        },
        {
            type: CLIENT_NEW_MESSAGE,
            subtype: SERVER_TO_CLIENT,
            meta: {
                socket_id: socket.id
            },
            payload: {
                type: 'whisper-out',
                name: character.name,
                message: params.join(' ')
            }
        }]);
    });
}

function cmdGlobal(socket, params) {
    return [{
        type: CLIENT_NEW_MESSAGE,
        subtype: SERVER_TO_CLIENT,
        payload: {
            name: socket.user.name,
            message: params.join(' '),
            type: 'global'
        }
    }];
}

export default function parseCommand(socket, action, getState) {
    return new Promise((resolve, reject) => {
        const payload = action.payload.toString().trim().split(' ');

        if (!payload[0]) {
            return resolve();
        }

        const command = payload.shift().toLowerCase();
        const params = payload;

        // Global commands, no grid restriction.
        switch(command) {
            case '/global':
            case '/g':
                return resolve(cmdGlobal(socket, params))
                break;

            case '/whisper':
            case '/w':
            case '/tell':
            case '/pm':
                return cmdWhisper(socket, params, (output) => {
                    resolve(output);
                })
                break;

            case '/say':
            case '/s':
                // because the first word is removed from the command,
                // we put it back, since its considered part of the message
                return resolve(cmdSay(socket, params))
                break;

            case '/give':
                //return cmdGive(io, socket, params)
                break;

            default:
                if (command && command[0] !== '/') {
                    // because the first word is removed from the command,
                    // we put it back, since its considered part of the message
                    params.unshift(command);
                    return resolve(cmdSay(socket, params))
                }
                break;
        }
    })
}