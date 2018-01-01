import fs from 'fs';
import descriptions from '../../data/descriptions.json';
import buildings from '../../data/buildings.json';
import commands from '../../data/commands.json';
import { SERVER_LOAD_MAP } from './redux/types';

export default class GameMap {
    constructor(data) {
        // holds players and NPCs for the current players grid, locally.
        this.local = {
            players: {},
            npcs: {},
            items: []
        }

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
                const gridActions = {};
                let   buildingObj;
                let   action;

                gridBuildingId.map((buildingId) => {
                    buildingObj = buildings[buildingId];

                    if (buildingObj) {
                        gridBuildings[buildingId] = buildingObj;

                        Object.keys(buildingObj.commands).map((command) => {
                            if (commands[command]) {
                                action = {
                                    ...commands[command],
                                    ...buildingObj.commands[command]
                                }

                                buildingObj.commands[command] = action;
                                gridActions[command] = action;
                            }
                        })
                    }
                })

                this.grid[y][x].buildings = gridBuildings;
                this.grid[y][x].actions = gridActions;
            });
        });

        callback()
    }

    isValidNewLocation(location, move) {
        // move = { grid: 'x', direction: -1 }
        // location =  { map: 'newyork', y: 1, x: 1 }

        const newPostion = {
            x: location.x,
            y: location.y
        }

        if (move.grid === 'x') {
            newPostion.x = newPostion.x + move.direction;
        } else {
            newPostion.y = newPostion.y + move.direction;
        }

        return (this.isValidPostion(newPostion.x, newPostion.y) ? newPostion : null);
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

export function loadLocalGrid(getState, location) {
    return new Promise((resolve, reject) => {
        let locationItems = [];
        let locationPlayers = {};
        let locationNpcs = {};

        const locations = getState().characters.locations;
        if (locations) {
            if (locations[location.map]) {
                if (locations[location.map][location.y]) {
                    if (locations[location.map][location.y][location.x]) {
                        locationPlayers = {
                            ...locations[location.map][location.y][location.x]
                        }
                    }
                }
            }
        }

        const items = getState().items.locations;
        if (items) {
            if (items[location.map]) {
                if (items[location.map][location.y]) {
                    if (items[location.map][location.y][location.x]) {
                        locationItems = [
                            ...items[location.map][location.y][location.x]
                        ];
                    }
                }
            }
        }

        resolve(locationPlayers, locationItems, locationNpcs)
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