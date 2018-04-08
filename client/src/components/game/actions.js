import {
    COMMAND_CHAT_COMMAND,
    CHARACTER_LOGOUT,
} from 'shared/actionTypes';

import {socketSend} from '../app/actions';

export function newCommand(command) {
    return socketSend({
        type: COMMAND_CHAT_COMMAND,
        payload: command,
    });
}

export function gameLogout(command) {
    return {
        type: CHARACTER_LOGOUT,
        payload: null,
    };
}
