import Promise from 'bluebird';

/**
 * Structure Object class
 */
export default class Structure {
    /**
     * class constructor
     * @param  {Game} Game          The Game object
     * @param  {Object} structureData The structure template object
     * @param  {Object} location      The location object {map, x, y}
     */
    constructor(Game, structureData, location) {
        this.Game = Game;
        // add the building details
        Object.assign(this, structureData);
        // add the location of the building
        this.location = location;
    }

    /**
     * Loads structure shops
     * @return {Promise}
     */
    loadShops() {
        if (!this.shops || !this.shops.length) {
            return;
        }

        const total = this.shops.length;
        let loaded = 0;
        const shopsList = [...this.shops];
        this.shops = [];

        shopsList.forEach((shopId) => {
            this.shops.push(this.Game.shopManager.add(shopId));

            loaded++;

            if (loaded >= total) {
                resolve(loaded);
            }
        });
    }
}
