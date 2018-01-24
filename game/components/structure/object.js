import Promise from 'bluebird';

export default class Structure {
    constructor(Game, structureData, location) {
        this.Game = Game;
        // add the building details
        Object.assign(this, structureData);
        // add the location of the building
        this.location = location;
    }

    loadShops() {
        return new Promise((resolve, reject) => {
            if (!this.shops || !this.shops.length) {
                return resolve();
            }

            this.shops.forEach(async (shopId, index) => {
                return this.shops[index] = await this.Game.shopManager.add(shopId);
            });

            resolve();
        });
    }
}