import { GAME_ADD_PLAYER, GAME_REMOVE_PLAYER } from '../../components/player/redux/types';

const defaultState = {
    npcs: {},
    players: {},
    locations: {}
}

export default function(state = defaultState, action) {
    let players;

    switch (action.type) {
        case GAME_ADD_PLAYER:
            players = {...state.players};
            players[action.payload.user_id] = action.payload.name;
            return {
                ...state,
                players
            };

        case GAME_REMOVE_PLAYER:
            players = {...state.players};
            delete players[action.payload.user_id];
            return {
                ...state,
                players
            };
    }

    return state;
}