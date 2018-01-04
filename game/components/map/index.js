import descriptions from '../../data/descriptions.json';
import buildings from '../../data/buildings.json';
import commands from '../../data/commands.json';

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

class GameMap {
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

export default GameMap;