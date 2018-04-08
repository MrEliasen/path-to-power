import {
    GAME_EVENT,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
    GAME_NEWS,
} from 'shared/actionTypes';

import {getRandomColour} from '../../../helper';
import {CLEAR_EVENTS} from './types';

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

        case GAME_NEWS:
            events = [...state];

            events.push({
                type: 'game-news',
                message: action.payload,
                colour: getRandomColour(),
            });

            return events.reverse().splice(0, 150).reverse();

        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
            return [];
    }

    return state;
}
