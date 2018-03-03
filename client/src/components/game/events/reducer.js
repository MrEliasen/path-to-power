import {NEW_EVENT, COMMAND_ERROR, CLEAR_EVENTS} from './types';
import {REMOTE_LOGOUT} from '../../../shared/types';

export default function(state = [], action) {
    let events;

    switch (action.type) {
        case CLEAR_EVENTS:
            return [];

        case NEW_EVENT:
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

        case REMOTE_LOGOUT:
            return [];
    }

    return state;
}
