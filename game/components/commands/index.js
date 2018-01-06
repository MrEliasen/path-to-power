import { clientCommandError } from './redux/actions';
import cmdGive from './commands/give';
import cmdPickup from './commands/pickup';
import cmdDrop from './commands/drop';
import cmdHeal from './commands/heal';
import cmdSay from './commands/say';
import cmdWhisper from './commands/whisper';
import cmdGlobal from './commands/global';
import cmdAim from './commands/aim';
import cmdRelease from './commands/release';
import cmdFlee from './commands/flee';
import cmdPunch from './commands/punch';
import cmdStrike from './commands/strike';
import cmdShoot from './commands/shoot';
import { loadShop } from '../shop/redux/actions';

export function checkCommandAtLocation(socket, getState, command, callback) {
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

export default function parseCommand(socket, action, getState, dispatch) {
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

            case '/pickup':
            case '/get':
                return cmdPickup(socket, params, getState, resolve);
                break;

            case '/shop':
                return loadShop(socket, params, getState, resolve);
                break;

            case '/aim':
                return cmdAim(socket, params, getState, resolve, dispatch);
                break;

            case '/flee':
                return cmdFlee(socket, params, getState, resolve, dispatch);
                break;

            case '/punch':
                return cmdPunch(socket, params, getState, resolve);
                break;

            case '/strike':
                return cmdStrike(socket, params, getState, resolve);
                break;

            case '/shoot':
                return cmdShoot(socket, params, getState, resolve);
                break;

            case '/release':
                return cmdRelease(socket, params, getState, resolve);
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