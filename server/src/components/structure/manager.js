// manager specific imports
import Structure from './object';
import structureList from '../../data/structures.json';
import structureCommands from './commands';

/**
 * Structure Manager
 */
export default class StructureManager {
    /**
     * class constructor
     * @param  {Game} Game The game object
     */
    constructor(Game) {
        this.Game = Game;
        // list of structures to manage
        this.structures = {};
    }

    /**
     * Load all structure commands
     * @return {Promise}
     */
    init() {
        // load map commands
        this.Game.commandManager.registerManager(structureCommands);
        console.log('STRUCTURES MANAGER LOADED');
    }

    /**
     * Add map structures to the managed object
     * @param {String} map_id       Map ID
     * @param {Number} x
     * @param {Number} y
     * @param {String} structure_id Structure ID
     * @return {Promise}
     */
    add(map_id, x, y, structure_id) {
        const structureData = structureList[structure_id];
        const newStructure = new Structure(this.Game, structureData, {map: map_id, x, y});

        // Generate the structure location, should it not exist.
        this.structures[map_id] = this.structures[map_id] || {};
        this.structures[map_id][`${y}_${x}`] = this.structures[map_id][`${y}_${x}`] || [];

        // load any shops which are set for this structure
        newStructure.loadShops();

        // add structure to the managed structures array
        this.structures[map_id][`${y}_${x}`].push(newStructure);

        // return the new structure object
        return newStructure;
    }

    /**
     * returns a list of buildings, at a given location, which has the speicifc command available
     * @param  {String} map_id  Map ID
     * @param  {Number} x
     * @param  {Number} y
     * @param  {String} command the command to search for
     * @return {Promise}
     */
    getWithCommand(map_id, x, y, command) {
        //check if a structure at the given location has the command
        const structures = this.getGrid(map_id, x, y);
        let matches = [];

        if (structures.length) {
            matches = structures.filter((structure) => {
                if (structure.commands) {
                    return structure.commands[command];
                }
            });
        }

        // if we didn't find any matching buildings..
        if (!matches.length) {
            return null;
        }

        return matches;
    }

    /**
     * returns a list of buildings, at a given location, which has shops
     * @param  {String} map_id  Map ID
     * @param  {Number} x
     * @param  {Number} y
     * @return {Promise}
     */
    getWithShop(map_id, x, y) {
        //check if a structure at the given location has the command
        const structures = this.getGrid(map_id, x, y);
        let shops = [];

        if (structures.length) {
            const buildings = structures.filter((structure) => structure.shops && structure.shops.length);

            // if there are buildings with shops, generate the array of shops to send back to the function caller
            if (buildings.length) {
                buildings.forEach((building) => {
                    shops = shops.concat(building.shops);
                });
            }
        }

        // if we didn't find any matching buildings..
        if (!shops.length) {
            return null;
        }

        return shops;
    }

    /**
     * Returns the list of structures at a given position
     * @param  {String} map_id Map Id
     * @param  {Number} x
     * @param  {Number} y
     * @param  {Boolean} forClient Whether the structure objects should be returns or a plain obj
     * @return {Array}        list of buildings
     */
    getGrid(map_id, x, y, forClient = false) {
        let structures = this.structures[map_id] || {};
        structures = structures[`${y}_${x}`] || [];

        if (!forClient) {
            return structures;
        }

        // return a plain object of the structures and their shops
        return structures.map((structure) => {
            return {
                name: structure.name,
                colour: structure.colour,
                commands: structure.commands,
                shops: structure.shops.map((shop) => {
                    return {
                        id: shop.id,
                        name: shop.name,
                        description: shop.description,
                    };
                }),
            };
        });
    }

    /**
     * Get the list of structures in a given map, and their location
     * @param  {String} mapId The map ID
     * @return {Array}
     */
    getMapData(mapId) {
        const structureList = this.structures[mapId] || {};
        const structureData = [];

        // Loop the grids with structures
        Object.keys(structureList).forEach((gridId) => {
            // look the buildings within a grid
            structureList[gridId].forEach((obj) => {
                structureData.push({
                    name: obj.name,
                    colour: obj.colour,
                    location: {
                        x: obj.location.x,
                        y: obj.location.y,
                    },
                });
            });
        });

        return structureData;
    }
}
