import { combineReducers } from 'redux';

import BuildingReducer from './components/building/redux/reducer';
import PlayerReducer from './components/player/redux/reducer';
import ItemReducer from './components/item/redux/reducer';
import GameReducer from './core/redux/reducer';

const rootReducer = combineReducers({
    players: PlayerReducer,
    game: GameReducer
});

export default rootReducer;

/*
// DEFAULT EXAMPLE STATE
{
    players: {
        "player-id-1": {...},
        "player-id-2": {...}
    },
    npcs: {
        "npc-id-1": {...},
        "npc-id-2": {...}
    },
    items: {
        "item-id-1": {...},
        "item-id-2": {...}
    },
    game: {
        npcs: 
        players: {}, // online players list
        locations: { // keeps track of the location of all players and NPCs
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
}
*/