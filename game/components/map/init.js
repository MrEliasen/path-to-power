import fs from 'fs';
import { SERVER_LOAD_MAP } from './redux/types';
import GameMap from './index';

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