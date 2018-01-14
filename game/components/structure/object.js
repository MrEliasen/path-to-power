export default class Structure {
    constructor(Game, structureData, location) {
        this.Game = Game;
        // add the building details
        Object.assign(this, structureData);
        // add the location of the building
        this.location = location;
    }

    loadShop() {
        if (!this.shops || !this.shops.length) {
            return;
        }

        this.shops = this.shops.map((shopId) => {
            return this.Game.shopManager.add(shopId);
        })
    }
}