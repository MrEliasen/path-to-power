import {GAME_EVENT} from 'shared/actionTypes';
import {CLEAR_EVENTS} from './types';

export function newEvent(payload) {
    return {
        type: GAME_EVENT,
        payload,
    };
}

export function clearEvents() {
    return {
        type: CLEAR_EVENTS,
        payload: null,
    };
}
