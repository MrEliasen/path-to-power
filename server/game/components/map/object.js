/**
 * Game map object
 */
export default class GameMap {
    /**
     * class constructor
     * @param  {Game} Game The Game object
     * @param  {Object} data The map plain object from data.json file
     */
    constructor(Game, data) {
        this.Game = Game;
        Object.assign(this, data);
    }

    /**
     * Loads the NPCs for the map
     * @return {Promise}
     */
    loadNpcs() {
        // Load all NPCS for map
        this.npcs.forEach((npc, index) => {
            let amount = npc.amount || 1;

            for (let i = amount; i > 0; i--) {
                this.Game.npcManager.create(npc, this, false);
            }
        });

        return this.npcs.length;
    }

    /**
     * Loads the map structures
     * @return {Promise}
     */
    loadStructures() {
        // Load all structures for map
        this.structures.forEach((structure) => {
            this.Game.structureManager.add(this.id, structure.x, structure.y, structure.id);
        });

        return this.structures.length;
    }

    /**
     * Generates the map object's Structures
     * @return {Promise}
     */
    generate() {
        // Save the character information (stats/location/etc)
        const npcs = this.loadNpcs();
        this.Game.logger.info(`Generated ${npcs} NPCs in map "${this.id}"`);

        const structures = this.loadStructures();
        this.Game.logger.info(`Generated ${structures} structures in map "${this.id}"`);
    }

    /**
     * Validates if the given x/y position is out of bounds
     * @param  {Number}  x
     * @param  {Number}  y
     * @return {Boolean}
     */
    isValidPostion(x, y) {
        x = parseInt(x);
        y = parseInt(y);

        if (isNaN(x) || isNaN(y)) {
            return false;
        }

        if (y < 0 || y > this.gridSize.y) {
            return false;
        }

        if (x < 0 || x > this.gridSize.x) {
            return false;
        }

        return true;
    }
}
