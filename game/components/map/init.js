import fs from 'fs';
import { SERVER_LOAD_MAP } from './redux/types';
import GameMap from './index';

export function loadLocalGrid(getState, location) {
    return new Promise((resolve, reject) => {
        let items = [];
        let players = {};
        let npcs = {};

        const localplayers = getState().characters.locations;
        if (localplayers) {
            if (localplayers[location.map]) {
                if (localplayers[location.map][location.y]) {
                    if (localplayers[location.map][location.y][location.x]) {
                        players = {
                            ...localplayers[location.map][location.y][location.x]
                        }
                    }
                }
            }
        }

        const localitems = getState().items.locations;
        if (localitems) {
            if (localitems[location.map]) {
                if (localitems[location.map][location.y]) {
                    if (localitems[location.map][location.y][location.x]) {
                        items = [
                            ...localitems[location.map][location.y][location.x]
                        ];
                    }
                }
            }
        }

        resolve({players, items, npcs})
    })
}

export function createMap(mapData) {
    return new Promise((resolve, rejecte) => {
        const newMap = new GameMap(mapData);

        newMap.loaded.then(() => {
            resolve(newMap);
        })
    })
}

export function initialiseMaps(dispatch) {
    return new Promise((resolve, rejecte) => {
        const maps = fs.readdirSync(`${__dirname}/../../data/maps`);
        let loadedmaps = 0;

        maps.map((mapname) => {
            let mapData = require(`${__dirname}/../../data/maps/${mapname}`);

            createMap(mapData).then((loadedMap) => {
                loadedmaps++;

                dispatch({
                    type: SERVER_LOAD_MAP,
                    payload: loadedMap
                })

                if (loadedmaps === maps.length) {
                    resolve();
                }
            })
        })
    })
}