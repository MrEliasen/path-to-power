/*import cmdPickup from './commands/pickup';
import cmdDrop from './commands/drop';
import cmdHeal from './commands/heal';
import cmdAim from './commands/aim';
import cmdRelease from './commands/release';
import cmdFlee from './commands/flee';
import cmdPunch from './commands/punch';
import cmdStrike from './commands/strike';
import cmdShoot from './commands/shoot';*/
import cmdSay from './commands/say';
import cmdGive from './commands/give';
import cmdGlobal from './commands/global';
import cmdWhisper from './commands/whisper';
import { GAME_COMMAND } from './types';

export default class CommandManager {
    constructor(Game) {
        this.Game = Game;

        // log manager progress
        this.Game.logger.debug('CommandManager::constructor Loaded');

        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
    }

    /**
     * checks for dispatches, and reacts only if the type is listend to
     * @param  {Socket.IO Socket} socket Client who dispatched the action
     * @param  {Object} action The redux action
     */
    onDispatch(socket, action) {
        if (action.type !== GAME_COMMAND) {
            return;
        }

        const payload = action.payload.toString().trim().split(' ');

        if (!payload[0]) {
            return resolve();
        }

        const command = payload.shift().toLowerCase();
        const params = payload;

        return this.exec(socket, command, params);
    }

    exec(socket, command, params) {
        this.Game.logger.info('CommandManager::exec', {command, params});

        // Global commands, no grid restriction.
        switch(command) {
            case '/global':
            case '/g':
                return cmdGlobal(socket, command, params, this.Game)
                break;

            case '/whisper':
            case '/w':
            case '/tell':
            case '/pm':
                return cmdWhisper(socket, command, params, this.Game)
                break;

            case '/say':
            case '/s':
                // because the first word is removed from the command,
                // we put it back, since its considered part of the message
                return cmdSay(socket, command, params, this.Game)
                break;

            case '/heal':
                return cmdHeal(socket, command, params, this.Game);
                break;

            case '/give':
                return cmdGive(socket, command, params, this.Game);
                break;

            case '/drop':
                return cmdDrop(socket, command, params, this.Game);
                break;

            case '/pickup':
            case '/get':
                return cmdPickup(socket, command, params, this.Game);
                break;

            case '/shop':
                return loadShop(socket, command, params, this.Game);
                break;

            case '/aim':
                return cmdAim(socket, command, params, this.Game);
                break;

            case '/flee':
                return cmdFlee(socket, command, params, this.Game);
                break;

            case '/punch':
                return cmdPunch(socket, command, params, this.Game);
                break;

            case '/strike':
                return cmdStrike(socket, command, params, this.Game);
                break;

            case '/shoot':
                return cmdShoot(socket, command, params, this.Game);
                break;

            case '/release':
                return cmdRelease(socket, command, params, this.Game);
                break;

            default:
                if (command && command[0] !== '/') {
                    // because the first word is removed from the command,
                    // we put it back, since its considered part of the message
                    params.unshift(command);
                    return cmdSay(socket, command, params, this.Game)
                }
                break;
        }
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