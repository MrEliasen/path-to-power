// manager specific imports
import ShopList from '../../data/shops.json';
import Shop from './object';

export default class ShopManager {
    constructor(Game) {
        this.Game = Game;
        this.shops = [];
    }

    add(mapId, x, y, shopId) {
        this.Game.logger.info('ShopManager::add', {mapId, x, y, shopId})

        const ShopData = ShopList[shopId];
        const newShop = new Shop(this.Game, ShopData, {map: mapId, x, y}); 
        // add building to the managed buildings array
        this.shops.push(newShop);

        return newShop;
    }
}