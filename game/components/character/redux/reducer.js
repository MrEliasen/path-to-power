import { CHARACTER_ADD, CHARACTER_REMOVE } from './types';

export default function (state = {}, action) {
    let players;

    switch (action.type) {
        case CHARACTER_ADD:
            players = {...state};
            players[action.payload.user_id] = action.payload;
            return players

        case CHARACTER_REMOVE:
            players = {...state};
            delete players[action.payload.user_id];
            return players
    }

    return state;
}