export default class GameMap {
    constructor(Game, data) {
        this.Game = Game;
        Object.assign(this, data);
    }

    /**
     * Generates the map object's Structures
     * @return {Promise}
     */
    generate() {
        return new Promise((resolve, reject) => {
            // generate the map grid?
            // Load all structures for map
            this.structures.map((structure) => {
                this.Game.structureManager.add(this.id, structure.x, structure.y, structure.id);
            })
            resolve();
        });
    }

    /**
     * Validates if the given x/y position is out of bounds
     * @param  {Number}  x
     * @param  {Number}  y
     * @return {Boolean}
     */
    isValidPostion (x, y) {
        if (y < 0 || y > this.grid_size.y) {
            return false;
        }

        if (x < 0 || x > this.grid_size.x) {
            return false;
        }

        return true;
    }
}