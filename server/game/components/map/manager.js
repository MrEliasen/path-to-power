import fs from 'fs';

// manager specific imports
import {
    MAP_GRID_DETAILS,
    MAP_GET_LIST,
    MAP_LIST,
} from 'shared/actionTypes';

import GameMap from './object';
import descriptionList from '../../data/descriptions.json';
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
        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
    }

    /**
     * Load all game maps
     * @return {Promise}
     */
    init() {
        // load map commands
        this.Game.commandManager.registerManager(mapCommands);

        // get the list of map files in our data maps directory
        const maplist = fs.readdirSync(`${__dirname}/../../data/maps`);

        // loop each of our mapfiles
        maplist.map((mapname) => {
            let mapData = require(`${__dirname}/../../data/maps/${mapname}`);
            this.maps[mapData.id] = new GameMap(this.Game, mapData);

            // generate the map, and once done, increment the counter and resolve if all maps are done.
            this.maps[mapData.id].generate();
        });

        console.log('MAP MANAGER LOADED');
    }

    /**
     * checks for dispatches, and reacts only if the type is listend to
     * @param  {Socket.IO Socket} socket Client who dispatched the action
     * @param  {Object} action The redux action
     */
    onDispatch(socket, action) {
        switch (action.type) {
            case MAP_GET_LIST:
                return this.sendMapList(socket, action);
        }

        return null;
    }

    /**
     * Dispatches the list of available maps to the client
     * @param  {Socket.io Socket} socket The socket the request is from
     */
    sendMapList(socket) {
        const list = this.getList();

        this.Game.socketManager.dispatchToSocket(socket, {
            type: MAP_LIST,
            payload: list,
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
    updateClient(user_id) {
        // Get the character object
        const character = this.Game.characterManager.get(user_id);

        if (!character) {
            return;
        }

        const location = [
            character.location.map,
            character.location.x,
            character.location.y,
        ];

        // dispatch to client
        this.Game.socketManager.dispatchToUser(user_id, {
            type: MAP_GRID_DETAILS,
            payload: {
                description: this.generateDescription(),
                players: this.Game.characterManager.getLocationList(...location, character.user_id, true),
                npcs: this.Game.npcManager.getLocationList(...location, true),
                items: this.Game.itemManager.getLocationList(...location, true),
                structures: this.Game.structureManager.getGrid(...location, true),
            },
        });
    }

    /**
     * Fetches the game map, if found
     * @param  {String} map_id Map Id of map to fetch
     * @return {Promise}
     */
    get(map_id) {
        const gameMap = this.maps[map_id];

        if (!gameMap) {
            return null;
        }

        return gameMap;
    }

    /**
     * Return a map object, matching the name
     * @param  {Strinmg} mapName Name or part of name to search for
     * @return {Map}
     */
    getByName(mapName) {
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
                gridSize: this.maps[mapId].gridSize,
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
        const gameMap = this.get(map_id);

        if (!gameMap.isValidPostion(x, y)) {
            return null;
        }

        return {
            map: gameMap.id,
            x: parseInt(x, 10),
            y: parseInt(y, 10),
        };
    }

    /**
     * Generates helper output for a map
     * @param  {Mixed}  map  Game map object or string. if string, it will search for the map object
     * @return {Mixed}       Message array if found, null otherwise.
     */
    getInfo(mapObject) {
        if (typeof mapObject === 'string') {
            mapObject = this.getByName(mapObject);

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
