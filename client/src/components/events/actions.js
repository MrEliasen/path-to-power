import {NEW_EVENT, CLEAR_EVENTS} from './types';

export function newEvent(payload) {
    return {
        type: NEW_EVENT,
        payload,
    };
}

export function clearEvents() {
    return {
        type: CLEAR_EVENTS,
        payload: null,
    };
}
