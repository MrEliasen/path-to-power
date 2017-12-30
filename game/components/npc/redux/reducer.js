import { NPC_REMOVE, NPC_ADD } from './types';

export default function(state = {}, action) {
    let npcs;

    switch (action.type) {
        case NPC_ADD:
            npcs = {...state};
            npcs[action.payload.npc_id] = action.payload;

            return npcs;

        case NPC_REMOVE:
            npcs = {...state};
            delete npcs[action.payload.npc_id];

            return npcs;
    }

    return state;
}