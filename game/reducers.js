import { combineReducers } from 'redux';

import BuildingReducer from './components/building/redux/reducer';
import ItemReducer from './components/item/redux/reducer';
import MapReducer from './components/map/redux/reducer';
import NPCReducer from './components/npc/redux/reducer';
import CharacterReducer from './components/character/redux/reducer';

const rootReducer = combineReducers({
    characters: CharacterReducer,
    buildings: BuildingReducer,
    npcs: NPCReducer,
    items: ItemReducer,
    maps: MapReducer
});

export default rootReducer;

/*
// DEFAULT EXAMPLE STATE
{
    players: {
        "player-id-1": {...},
        "player-id-2": {...}
    },
    buildings: {
        "building-id-1": {...},
        "building-id-2": {...}
    },
    npcs: {
        "npc-id-1": {...},
        "npc-id-2": {...}
    },
    items: {
        "item-id-1": {...},
        "item-id-2": {...}
    },
    maps: { // keeps track of the location of all players and NPCs
        "london": [ // map name
            2: [ // y coordinate
                1: { //x coordinate
                    players: [
                        "player-id-1"
                    ],
                    npc: [
                        "npc-id-1"
                    ]
                }
            ]
        ]
    }
}
*/