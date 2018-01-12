// manager specific imports
import Structure from './object';
import structureList from '../../data/structures.json' ;

export default class StructureManager {
    constructor(Game) {
        this.Game = Game;
        // list of structures to manage
        this.structures = {};
    }

    /**
     * Add map structures to the managed object
     * @param {String} map_id       Map ID
     * @param {Number} x            
     * @param {Number} y            
     * @param {String} structure_id Structure ID
     * @return {Structure Obj} The new structure object.
     */
    add(map_id, x, y, structure_id) {
        this.Game.logger.info('StructureManager::add', {map_id, structure_id, x, y});

        const structureData = structureList[structure_id];
        const newStructure = new Structure(this.Game, structureData, {map: map_id, x, y});

        // Generate the structure location, should it not exist.
        this.structures[map_id] = this.structures[map_id] || {};
        this.structures[map_id][y] = this.structures[map_id][y] || {};
        this.structures[map_id][y][x] = this.structures[map_id][y][x] || [];

        // add structure to the managed structures array
        this.structures[map_id][y][x].push(newStructure);

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
        return new Promise((resolve, reject) => {
            //check if a structure at the given location has the command
            const structures = this.getGrid(map_id, x, y);
            let matches = [];

            if (structures.length) {
                structures.map((structure) => {
                    if (structure.commands[command]) {
                        matches.push(structure);
                    }
                })
            }

            // if we didn't find any matching buildings..
            if (!matches.length) {
                return reject(`No buildings at ${map_id}/${y}/${x}, matching command ${command}`);
            }

            resolve(matches);
        })
    }

    /**
     * Returns the list of structures at a given position
     * @param  {String} map_id Map Id
     * @param  {Number} x      
     * @param  {Number} y      
     * @return {Array}        list of buildings
     */
    getGrid(map_id, x, y) {
        // check if the location is even set to have structures
        if (!this.structures[map_id]) {
            return [];
        }
        if (!this.structures[map_id][y]) {
            return [];
        }
        if (!this.structures[map_id][y][x]) {
            return [];
        }

        return this.structures[map_id][y][x];
    }
}