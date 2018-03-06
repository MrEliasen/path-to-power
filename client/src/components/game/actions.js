import {GAME_COMMAND} from './types';

export function newCommand(command) {
    return {
        type: GAME_COMMAND,
        payload: command,
    };
}