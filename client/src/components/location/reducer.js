import {
    JOIN_GRID,
    JOINED_GRID,
    LEFT_GRID,
    UPDATE_GROUND_ITEMS,
    CLIENT_PICKUP_ITEM,
    CLIENT_DROP_MULTIPLE_ITEMS,

    NPC_JOINED_GRID,
    NPC_LEFT_GRID,
} from './types';
import {REMOTE_LOGOUT} from '../../../../server/shared/types';

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
        case JOIN_GRID:
            return {
                ...action.payload,
            };

        // when another character joins the players grid
        case JOINED_GRID:
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
        case LEFT_GRID:
            players = [...state.players];
            players = players.filter((user) => user.user_id !== action.payload);
            return {
                ...state,
                players,
            };

        case CLIENT_DROP_MULTIPLE_ITEMS:
            local = {...state.local};

            action.payload.map((item) => {
                if (item.stackable) {
                    let stacked = false;
                    local.items.map((item, index) => {
                        if (item.id === item.id) {
                            stacked = true;
                            local.items[index].durability += item.durability;
                        }
                    });

                    if (!stacked) {
                        local.items.push(item);
                    }
                } else {
                    local.items.push(item);
                }
            });

            return {
                ...state,
                local,
            };

        case UPDATE_GROUND_ITEMS:
            return {
                ...state,
                items: action.payload,
            };

        case CLIENT_PICKUP_ITEM:
            local = {...state.local};

            if (action.payload.remove) {
                local.items.splice(action.payload.index, 1);
            } else {
                local.items[action.payload.index].durability = local.items[action.payload.index].durability - action.payload.amount;
            }

            return {
                ...state,
                local,
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
        case REMOTE_LOGOUT:
            return defaultState;
    }

    return state;
}
