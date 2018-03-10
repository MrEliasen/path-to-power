import {GAME_COMMAND, GAME_LOGOUT} from './types';
import {socketSend} from '../app/actions';

export function newCommand(command) {
    return socketSend({
        type: GAME_COMMAND,
        payload: command,
    });
}

export function gameLogout(command) {
    return {
        type: GAME_LOGOUT,
        payload: null,
    };
}
