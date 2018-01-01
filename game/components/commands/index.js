import { CLIENT_NEW_MESSAGE } from './redux/types';
import { clientCommandError } from './redux/actions';
import { SERVER_TO_CLIENT } from '../socket/redux/types';
import { newEvent } from '../socket/redux/actions';
import { getCharacterByName } from '../character/db/controller';
import { updateClientCharacter, updateCharacter } from '../character/redux/actions';
import { dropItem, serverRecordItemDrop } from '../item/redux/actions';

function checkCommandAtLocation(socket, getState, command, callback) {
    const character = getState().characters.list[socket.user.user_id] || null;

    if (!character) {
        return callback([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
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
            ...clientCommandError('There is nowhere to do that.'),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const actionModifiers = location.actions[command];
    callback(null, character, location, actionModifiers)
}

function cmdGive(socket, params, getState, resolve) {
    if (!params[0]) {
        return resolve();
    }

    const itemKey = params[0];
    const amount = parseInt(params[1]) || 1;
    const character = getState().characters.list[socket.user.user_id] || null;
    const item = getState().items.list[itemKey];
    const meta = {
        socket_id: socket.id
    }

    if (!character) {
        return callback([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    if (!item) {
        return resolve([{
            ...clientCommandError('Invalid items.'),
            meta
        }]);
    }

    character.giveItem(item, amount);

    return resolve([
        updateCharacter(character),
        {
            ...newEvent(`Your received ${amount}x ${item.name}`),
            meta,
        },
        {
            ...updateClientCharacter(character),
            meta
        }
    ])
}

function cmdDrop(socket, params, getState, resolve) {
    if (!params[0]) {
        return resolve();
    }

    const character = getState().characters.list[socket.user.user_id] || null;
    const meta = {
        socket_id: socket.id
    }
    let amount = params.pop();
    let needle = params || [];

    // If the last parameter is not considered a number
    // assume its part of the item name, and set amount default 1
    if (!parseInt(amount)) {
        needle.push(amount);
        amount = 1;
    }

    needle = needle.join(' ').toLowerCase();

    if (!character) {
        return resolve([{
            ...clientCommandError('Invalid character. Please logout and back in.'),
            meta
        }]);
    }

    const grid = `${character.location.map}_${character.location.x}_${character.location.y}`;
    const itemList = getState().items.list;
    let droppedItem = character.dropItem(needle, amount, itemList);

    if (!droppedItem) {
        return resolve([{
            ...clientCommandError('You do not have any of that item.'),
            meta
        }]);
    }

    resolve([
        updateCharacter(character),
        serverRecordItemDrop({
            item: {
                id: droppedItem.id,
                durability: droppedItem.stats.durability
            },
            location: {
                map: character.location.map,
                x: character.location.x,
                y: character.location.y
            }
        }),
        {
            ...dropItem({
                id: droppedItem.id,
                durability: droppedItem.stats.durability
            }),
            meta: {
                target: grid
            }
        },
        {
            ...newEvent(`Your dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`),
            meta,
        },
        {
            ...newEvent(`${character.name} dropped ${(droppedItem.stats.stackable ? 'a' : `${amount}x`)} ${droppedItem.name} on the ground`),
            meta: {
                target: grid
            }
        },
        {
            ...updateClientCharacter(character),
            meta
        }
    ])
}

function cmdHeal(socket, params, getState, command, resolve) {
    let healAmount = parseInt(params[0]);
    const meta = {
        socket_id: socket.id
    }

    // Check if the healAmount is valid
    if (!healAmount || healAmount < 1) {
        return resolve([{
            ...clientCommandError('Invalid heal amount. Syntax: /heal <amount>'),
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
                ...clientCommandError('You are already at full health!'),
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
                ...clientCommandError('You do not have enough money to heal that amount.'),
                meta
            }]);
        }

        // remove money and add health
        character.stats.money = character.stats.money - price;
        character.stats.health = character.stats.health + healAmount;

        return resolve([
            updateCharacter(character),
            {
                ...newEvent(`You healed ${healAmount}, costing you ${price}`),
                meta,
            },
            {
                ...updateClientCharacter(character),
                meta
            }
        ])
    })
}

function cmdSay(socket, params, getState) {
    const character = getState().characters.list[socket.user.user_id] || null;
    let message = params.join(' ').trim();

    if (!message || !character) {
        return [];
    }

    return [{
        ...newEvent({
            type: 'local',
            name: socket.user.name,
            message: message
        }),
        meta: {
            target: `${character.location.map}_${character.location.x}_${character.location.y}`
        } 
    }];
}

function cmdWhisper(socket, params, callback) {
    if (params.length < 2) {
        return callback([{
            ...clientCommandError('Invalid whisper. Syntax: /w <username> <message>'),
            meta: {
                socket_id: socket.id
            }
        }]);
    }

    const playername = params.shift();

    getCharacterByName(playername, function(err, character) {
        if (err) {
            return callback([err]);
        }

        if (!character) {
            return callback([{
                ...clientCommandError('Invalid whisper target.'),
                meta: {
                    socket_id: socket.id
                }
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
                return resolve(cmdSay(socket, params, getState))
                break;

            case '/heal':
                return cmdHeal(socket, params, getState, command, resolve);
                break;

            case '/give':
                return cmdGive(socket, params, getState, resolve);
                break;

            case '/drop':
                return cmdDrop(socket, params, getState, resolve);
                break;

            default:
                if (command && command[0] !== '/') {
                    // because the first word is removed from the command,
                    // we put it back, since its considered part of the message
                    params.unshift(command);
                    return resolve(cmdSay(socket, params, getState))
                }
                break;
        }
    })
}