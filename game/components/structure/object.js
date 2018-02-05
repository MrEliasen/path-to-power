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

            const total = this.shops.length;
            let loaded = 0;
            const shopsList = [...this.shops];
            this.shops = [];

            shopsList.forEach(async (shopId) => {
                const shop = await this.Game.shopManager.add(shopId);
                this.shops.push(shop);

                loaded++

                if (loaded >= total) {
                    resolve(loaded);
                }
            });
        });
    }
}