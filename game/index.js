import { createStore, applyMiddleware } from 'redux';
import ReduxPromise from 'redux-promise';

import rootReducer from './reducers';
import socket from './socket';

const defaultState = {
    players: {},
    npcs: {},
    items: {}
}

export default function (redis, server) {
    const store = createStore(
        rootReducer,
        applyMiddleware(ReduxPromise)
    );

    socket(store, server);

    return this;
}

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