import { PLAYER_ADD, PLAYER_REMOVE } from './types';

const defaultState = {
    players: {}
}

export default function (state = defaultState, action) {
    let players;

    switch (action.type) {
        case PLAYER_ADD:
            players = {...state.players};
            players[action.payload.user_id] = action.payload.name;

            return {
                ...state,
                players
            }

        case PLAYER_REMOVE:
            players = {...state.players};
            delete players[action.payload.user_id];

            return {
                ...state,
                players
            }
    }

    return state;
}