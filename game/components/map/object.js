export default class GameMap {
    constructor(Game, data) {
        this.Game = Game;
        Object.assign(this, data);
    }

    /**
     * Generates the map object's buildings
     * @return {Promise}
     */
    generate() {
        return new Promise((resolve, reject) => {
            // generate the map grid?
            // Load all builds for map (with the BuildingManager)
            this.buildings.map((building) => {
                this.Game.buildingManager.add(this.id, building.x, building.y, building.id);
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