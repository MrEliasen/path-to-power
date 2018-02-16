import Promise from 'bluebird';

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
        return new Promise(async (resolve, reject) => {
            const total = this.npcs.length;
            let loaded = 0;

            // Load all NPCS for map
            this.npcs.forEach(async (npc) => {
                let amount = npc.amount || 1;

                for (let i = amount; i > 0; i--) {
                    await this.Game.npcManager.create(npc, this, false);
                }

                loaded++;
                this.Game.logger.info(`LOADED ${loaded}/${total} NPCs `, {name: this.name});

                if (loaded >= total) {
                    resolve(loaded);
                }
            });
        });
    }

    /**
     * Loads the map structures
     * @return {Promise}
     */
    loadStructures() {
        return new Promise((resolve) => {
            const total = this.structures.length;
            let loaded = 0;

            // Load all structures for map
            this.structures.forEach(async (structure) => {
                await this.Game.structureManager.add(this.id, structure.x, structure.y, structure.id);

                loaded++;
                this.Game.logger.info(`LOADED ${loaded}/${total} STRUCTURES `, {name: this.name});

                if (loaded >= total) {
                    this.Game.logger.info('LOADED ALL STRUCTURES', {name: this.name});
                    resolve(loaded);
                }
            });
        });
    }

    /**
     * Generates the map object's Structures
     * @return {Promise}
     */
    generate() {
        return new Promise((resolve) => {
            // Save the character information (stats/location/etc)
            this.loadNpcs()
                .then((npcs) => {
                    this.Game.logger.info(`Generated ${npcs} NPCs in map "${this.id}"`);

                    this.loadStructures()
                        .then((structures) => {
                            this.Game.logger.info(`Generated ${structures} structures in map "${this.id}"`);
                            resolve();
                        })
                        .catch((err) => {
                            this.Game.logger.error(err);
                        });
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                });
        });
    }

    /**
     * Validates if the given x/y position is out of bounds
     * @param  {Number}  x
     * @param  {Number}  y
     * @return {Boolean}
     */
    isValidPostion(x, y) {
        if (y < 0 || y > this.gridSize.y) {
            return false;
        }

        if (x < 0 || x > this.gridSize.x) {
            return false;
        }

        return true;
    }
}
