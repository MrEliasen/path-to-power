import {GAME_COMMAND} from './types';
import {socketSend} from '../app/actions';

export function newCommand(command) {
    return socketSend({
        type: GAME_COMMAND,
        payload: command,
    });
}
