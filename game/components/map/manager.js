import fs from 'fs';
import Promise from 'bluebird';

// manager specific imports
import GameMap from './object';
import descriptionList from '../../data/descriptions.json'; 
import { JOIN_GRID } from './types';
import mapCommands from './commands';

export default class MapManager {
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
                        this.Game.logger.error('MAP LOAD ERROR', err);
                    });
            })
        })
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
    updateClient(user_id) {
        // Get the character object
        this.Game.characterManager.get(user_id).then((character) => {
            const location = [
                character.location.map,
                character.location.x,
                character.location.y
            ]

            // dispatch to client
            this.Game.socketManager.dispatchToUser(user_id, {
                type: JOIN_GRID,
                payload: {
                    description: this.generateDescription(),
                    players: this.Game.characterManager.getLocationList(...location, character.user_id, true),
                    npcs: this.Game.npcManager.getLocationList(...location, true),
                    items: this.Game.itemManager.getLocationList(...location, true),
                    structures: this.Game.structureManager.getGrid(...location, true)
                }
            });
        })
        .catch();
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
                return reject(`Map with id ${map_id} was not found`);
            }

            resolve(gameMap);
        })
    }

    /**
     * Get a list of all map names by ID
     * @return {Object} {"mapId": "map name", ...}
     */
    getList() {
        const list = {};
        Object.keys(this.maps).map((mapId) => {
            list[mapId] = this.maps[mapId].name;
        })

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
                    y: parseInt(y, 10)
                })
            })
            .catch(() => {})
        })
    }
}