import { CLIENT_NEW_MESSAGE, CLIENT_COMMAND_ERROR } from './redux/types';
import { SERVER_TO_CLIENT, CLIENT_NEW_EVENT } from '../socket/redux/types';
import { CHARACTER_UPDATE } from '../character/redux/types';
import { getCharacterByName } from '../character/db/controller';
import { updateClientCharacter } from '../character/redux/actions';

function checkCommandAtLocation(socket, getState, command, callback) {
    const character = getState().characters.list[socket.user.user_id] || null;

    if (!character) {
        return callback([{
            type: CLIENT_COMMAND_ERROR,
            subtype: SERVER_TO_CLIENT,
            payload: 'Invalid character. Please logout and back in.',
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const map = getState().maps[character.location.map];
    const location = map.getPosition(character.location.x, character.location.y);

    // check if the command is available
    if (!Object.keys(location.actions).includes(command)) {
        return callback([{
            type: CLIENT_COMMAND_ERROR,
            subtype: SERVER_TO_CLIENT,
            payload: 'There is nowhere to do that.',
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const actionModifiers = location.actions[command];
    callback(null, character, location, actionModifiers)
}

function cmdHeal(socket, params, getState, command, resolve) {
    let healAmount = parseInt(params[0]);
    const meta = {
        socket_id: socket.id
    }

    // Check if the healAmount is valid
    if (!healAmount || healAmount < 1) {
        return resolve([{
            type: CLIENT_COMMAND_ERROR,
            subtype: SERVER_TO_CLIENT,
            payload: 'Invalid heal amount. Syntax: /heal <amount>',
            meta
        }]);
    }

    checkCommandAtLocation(socket, getState, command, (error, character, location, actionModifiers) => {
        if (error) {
            return resolve(error);
        }

        // Check if full health
        if (character.stats.health === character.stats.health_max) {
            return resolve([{
                type: CLIENT_COMMAND_ERROR,
                subtype: SERVER_TO_CLIENT,
                payload: 'You are already at full health!',
                meta
            }]);
        }

        // Check if the heal would exceed 100%, if so, cap it.
        if ((character.stats.health + healAmount) > character.stats.health_max) {
            healAmount = character.stats.health_max - character.stats.health;
        }

        // Check if they have the money
        const price = healAmount * actionModifiers.cost;
        if (actionModifiers.cost && price > character.stats.money) {
            return resolve([{
                type: CLIENT_COMMAND_ERROR,
                subtype: SERVER_TO_CLIENT,
                payload: 'You do not have enough money to heal that amount.',
                meta
            }]);
        }

        // remove money and add health
        character.stats.money = character.stats.money - price;
        character.stats.health = character.stats.health + healAmount;

        return resolve([{
                type: CHARACTER_UPDATE,
                payload: character
            },
            {
                type: CLIENT_NEW_EVENT,
                subtype: SERVER_TO_CLIENT,
                meta,
                payload: `You healed ${healAmount}, costing you ${price}`
            },
            {
                ...updateClientCharacter(character),
                meta
            }
        ])
    })
}

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
        return callback([{
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

            case '/heal':
                return cmdHeal(socket, params, getState, command, resolve);
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