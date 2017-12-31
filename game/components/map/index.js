import fs from 'fs';
import descriptions from '../../data/descriptions.json';
import buildings from '../../data/buildings.json';

export default class GameMap {
    constructor(data) {
        this.loaded = new Promise((resolve, rejecte) => {
            Object.assign(this, data);

            this.loadMap(() => {
                resolve(this);
            });
        });
    }

    loadMap(callback) {
        const descriptionCount = descriptions.length;

        this.grid.map((yGrid, y) => {
            yGrid.map((location, x) => {
                // choose a random description
                this.grid[y][x].description = descriptions[Math.floor(Math.random() * descriptionCount)];

                // load the builds on the grid
                const gridBuildingId = location.buildings || [];
                const gridBuildings = {};
                const actions = {};
                let   buildingObj;

                gridBuildingId.map((buildingId) => {
                    buildingObj = buildings[buildingId];

                    if (buildingObj) {
                        gridBuildings[buildingId] = buildingObj;

                        Object.keys(buildingObj.commands).map((command) => {
                            actions[command] = buildingObj.commands[command];
                        })
                    }
                })

                this.grid[y][x].buildings = buildings;
                this.grid[y][x].actions = actions;
            });
        });

        callback()
    }

    isValidPostion (x, y) {
        if (!this.grid[y]) {
            return false;
        }

        if (!this.grid[y][x]) {
            return false;
        }

        return true;
    }

    getPosition(x, y) {
        if (!this.isValidPostion(x,y)) {
            return null;
        }

        return this.grid[y][x];
    }
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
                    type: 'SERVER_LOAD_MAP',
                    payload: loadedMap
                })

                if (loadedmaps === maps.length) {
                    resolve();
                }
            })
        })
    })
}