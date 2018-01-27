import Promise from 'bluebird';

export default class GameMap {
    constructor(Game, data) {
        this.Game = Game;
        Object.assign(this, data);
    }

    loadNpcs() {
        return new Promise((resolve) => {
            const total = this.npcs.length;
            let loaded = 0;

            // Load all NPCS for map
            this.npcs.forEach(async (npc) => {
                let amount = npc.amount || 1;

                for (var i = amount; i > 0; i--) {
                    await this.Game.npcManager.create(npc, this, false);
                }

                loaded++

                if (loaded >= total) {
                    resolve(loaded);
                }
            });
        });
    }

    loadStructures() {
        return new Promise((resolve) => {
            const total = this.structures.length;
            let loaded = 0;

            // Load all structures for map
            this.structures.forEach(async (structure) => {
                await this.Game.structureManager.add(this.id, structure.x, structure.y, structure.id);
                loaded++

                if (loaded >= total) {
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
            const npcsLoaded = this.loadNpcs();
            const structureLoaded = this.loadStructures();

            Promise
                .all([npcsLoaded, structureLoaded])
                .then((values) => {
                    this.Game.logger.info(`Generated ${values[0]} NPCs and ${values[1]} structures for map "${this.id}"`);
                    resolve();
                });
        });
    }

    /**
     * Validates if the given x/y position is out of bounds
     * @param  {Number}  x
     * @param  {Number}  y
     * @return {Boolean}
     */
    isValidPostion (x, y) {
        if (y < 0 || y > this.gridSize.y) {
            return false;
        }

        if (x < 0 || x > this.gridSize.x) {
            return false;
        }

        return true;
    }
}