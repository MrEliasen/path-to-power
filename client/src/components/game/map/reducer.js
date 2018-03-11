import {
    MAP_GRID_DETAILS,
    CHARACTER_LEFT_GRID,
    CHARACTER_JOINED_GRID,
    NPC_JOINED_GRID,
    NPC_LEFT_GRID,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
    ITEM_GROUND_ITEMS,
} from 'shared/actionTypes';

const defaultState = {
    description: '',
    players: [],
    items: [],
    npcs: [],
    structures: [],
};

export default function(state = defaultState, action) {
    let players;
    let npcs;

    switch (action.type) {
        // When the character moves, and joins a new grid
        case MAP_GRID_DETAILS:
            return {
                ...action.payload,
            };

        // when another character joins the players grid
        case CHARACTER_JOINED_GRID:
            players = [...state.players];

            if (players.find((user) => user.user_id === action.payload.user_id)) {
                return state;
            }

            players.push(action.payload);
            return {
                ...state,
                players,
            };

        // when another character leaves the players grid
        case CHARACTER_LEFT_GRID:
            players = [...state.players];
            players = players.filter((user) => user.user_id !== action.payload);
            return {
                ...state,
                players,
            };

        case ITEM_GROUND_ITEMS:
            return {
                ...state,
                items: action.payload,
            };

        // when another character joins the npcs grid
        case NPC_JOINED_GRID:
            npcs = [...state.npcs];

            if (npcs.find((npc) => npc.id === action.payload.id)) {
                return state;
            }

            npcs.push(action.payload);
            return {
                ...state,
                npcs,
            };

        // when another character leaves the npcs grid
        case NPC_LEFT_GRID:
            npcs = [...state.npcs];
            npcs = npcs.filter((npc) => npc.id !== action.payload);
            return {
                ...state,
                npcs,
            };

        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
            return defaultState;
    }

    return state;
}
