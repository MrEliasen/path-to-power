import {
    GAME_EVENT,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
} from 'shared/actionTypes';

import {COMMAND_ERROR, CLEAR_EVENTS} from './types';

export default function(state = [], action) {
    let events;

    switch (action.type) {
        case CLEAR_EVENTS:
            return [];

        case GAME_EVENT:
            events = [...state];

            if (typeof action.payload === 'string') {
                action.payload = {
                    message: action.payload,
                };
            }

            events.push(action.payload);
            return events.reverse().splice(0, 150).reverse();

        case COMMAND_ERROR:
            events = [...state];

            if (typeof action.payload === 'string') {
                action.payload = {
                    message: action.payload,
                };
            }

            events.push({
                ...action.payload,
                type: 'command_error',
            });
            return events.reverse().splice(0, 100).reverse();

        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
            return [];
    }

    return state;
}
