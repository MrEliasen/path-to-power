/*import cmdGive from './commands/give';
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
import cmdShoot from './commands/shoot';*/

export default class CommandManager {
    constructor(Game) {
        this.Game = Game;
    }

    exec(command, params) {
        return this.Game.logger.info('CommandManager::exec', {command, params});

        // Global commands, no grid restriction.
        switch(command) {
            case '/global':
            case '/g':
                return cmdGlobal(params)
                break;

            case '/whisper':
            case '/w':
            case '/tell':
            case '/pm':
                return cmdWhisper(params)
                break;

            case '/say':
            case '/s':
                // because the first word is removed from the command,
                // we put it back, since its considered part of the message
                return cmdSay(params)
                break;

            case '/heal':
                return cmdHeal(params, command);
                break;

            case '/give':
                return cmdGive(params);
                break;

            case '/drop':
                return cmdDrop(params);
                break;

            case '/pickup':
            case '/get':
                return cmdPickup(params);
                break;

            case '/shop':
                return loadShop(params);
                break;

            case '/aim':
                return cmdAim(params);
                break;

            case '/flee':
                return cmdFlee(params);
                break;

            case '/punch':
                return cmdPunch(params);
                break;

            case '/strike':
                return cmdStrike(params);
                break;

            case '/shoot':
                return cmdShoot(params);
                break;

            case '/release':
                return cmdRelease(params);
                break;

            default:
                if (command && command[0] !== '/') {
                    // because the first word is removed from the command,
                    // we put it back, since its considered part of the message
                    params.unshift(command);
                    return cmdSay(params)
                }
                break;
        }
    }

    parse(action) {
        const payload = action.payload.toString().trim().split(' ');

        if (!payload[0]) {
            return resolve();
        }

        const command = payload.shift().toLowerCase();
        const params = payload;

        return this.exec(command, params);
    }
}
/*
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
}*/