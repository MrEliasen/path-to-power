import fs from 'fs';
import Promise from 'bluebird';

// manager specific imports
import GameMap from './object';
import descriptionList from '../../data/descriptions.json';
import {JOIN_GRID} from './types';
import mapCommands from './commands';

/**
 * Map Manager
 */
export default class MapManager {
    /**
     * class constructor
     * @param  {Game} Game The Game object
     */
    constructor(Game) {
        this.Game = Game;
        // the list of maps to manage
        this.maps = {};
    }

    /**
     * Load all game maps
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, rejecte) => {
            // load map commands
            this.Game.commandManager.registerManager(mapCommands);

            // get the list of map files in our data maps directory
            const maplist = fs.readdirSync(`${__dirname}/../../data/maps`);
            let loadedmaps = 0;

            // loop each of our mapfiles
            maplist.map((mapname) => {
                let mapData = require(`${__dirname}/../../data/maps/${mapname}`);
                this.maps[mapData.id] = new GameMap(this.Game, mapData);

                // generate the map, and once done, increment the counter and resolve if all maps are done.
                this.maps[mapData.id].generate()
                    .then(() => {
                        loadedmaps++;

                        if (loadedmaps === maplist.length) {
                            resolve(maplist.length);
                        }
                    })
                    .catch((err) => {
                        this.Game.logger.error(err.message);
                    });
            });
        });
    }

    /**
     * Generate a "random" description from the list
     * @return {String} the generated description
     */
    generateDescription() {
        return descriptionList[Math.floor(Math.random() * descriptionList.length)];
    }

    /**
     * Updates the client map location information
     * @param  {String} user_id  User Id of client to update
     */
    async updateClient(user_id) {
        // Get the character object
        await this.Game.characterManager.get(user_id)
            .then((character) => {
                const location = [
                    character.location.map,
                    character.location.x,
                    character.location.y,
                ];

                // dispatch to client
                this.Game.socketManager.dispatchToUser(user_id, {
                    type: JOIN_GRID,
                    payload: {
                        description: this.generateDescription(),
                        players: this.Game.characterManager.getLocationList(...location, character.user_id, true),
                        npcs: this.Game.npcManager.getLocationList(...location, true),
                        items: this.Game.itemManager.getLocationList(...location, true),
                        structures: this.Game.structureManager.getGrid(...location, true),
                    },
                });
            })
            .catch((err) => {
                this.Game.logger.error(err.message);
            });
    }

    /**
     * Fetches the game map, if found
     * @param  {String} map_id Map Id of map to fetch
     * @return {Promise}
     */
    get(map_id) {
        return new Promise((resolve, reject) => {
            const gameMap = this.maps[map_id];

            if (!gameMap) {
                return reject(new Error(`Map with id ${map_id} was not found`));
            }

            resolve(gameMap);
        });
    }

    /**
     * Return a map object, matching the name
     * @param  {Strinmg} mapName Name or part of name to search for
     * @return {Map}
     */
    getByName(mapName) {
        return new Promise((resolve, reject) =>{
            const gameMap = this.getByNameSync(mapName);

            if (!gameMap) {
                return reject(new Error('Game map not found'));
            }

            resolve(gameMap);
        });
    }

    /**
     * Synchronously get the Map object by name, if exists.
     * @param  {String} mapName Map name to search for
     * @return {Map}
     */
    getByNameSync(mapName) {
        mapName = mapName.toLowerCase();
        // first check if there is a direct match between the name and a map name
        let mapId = Object.keys(this.maps).find((mapId) => this.maps[mapId].name.toLowerCase() === mapName);

        // If the is no direct map, check for matches at the begining of the names
        if (!mapId) {
            mapId = Object.keys(this.maps).find((mapId) => this.maps[mapId].name.toLowerCase().indexOf(mapName) === 0);
        }

        return mapId ? this.maps[mapId] : null;
    }

    /**
     * Get a list of all map names by ID
     * @return {Object} {"mapId": "map name", ...}
     */
    getList() {
        const list = {};
        Object.keys(this.maps).forEach((mapId) => {
            // NOTE: if you want to change what map information the client get, change it here
            list[mapId] = {
                name: this.maps[mapId].name,
                buildings: this.Game.structureManager.getMapData(mapId),
            };
        });

        return list;
    }

    /**
     * Returns the spawn location (x,y,map) of a given map
     * @param  {String} map_id Map Id
     * @return {Object}        object containing {x,y,map}
     */
    getSpawn(map_id) {
        const gameMap = this.maps[map_id];

        if (!gameMap) {
            return null;
        }

        return gameMap.respawn;
    }

    /**
     * Checks the specific map, if the location is valid.
     * @param  {String}  map_id Map Id
     * @param  {Number}  x
     * @param  {Number}  y
     * @return {Promise}
     */
    isValidLocation(map_id, x, y) {
        return new Promise((resolve, reject) => {
            this.get(map_id).then((gameMap) => {
                if (!gameMap.isValidPostion(x, y)) {
                    return reject();
                }

                resolve({
                    map: gameMap.id,
                    x: parseInt(x, 10),
                    y: parseInt(y, 10),
                });
            })
            .catch((err) => {
                this.Game.logger.error(err.message);
            });
        });
    }

    /**
     * Generates helper output for a map
     * @param  {Mixed}  map  Game map object or string. if string, it will search for the map object
     * @return {Mixed}       Message array if found, null otherwise.
     */
    getInfo(mapObject) {
        if (typeof mapObject === 'string') {
            mapObject = this.getByNameSync(mapObject);

            // if the command does not exist
            if (!mapObject) {
                return null;
            }
        }

        const tab = '    ';
        let message = [
            'Map:',
            `${tab}${mapObject.name}`,
            'Size:',
            `${tab}${mapObject.gridSize.y}x${mapObject.gridSize.x}`,
        ];

        return message;
    }
}
