// manager specific imports
import ShopList from '../../data/shops.json';
import Shop from './object';

export default class ShopManager {
    constructor(Game) {
        this.Game = Game;
        this.shops = [];
    }

    add(shopId) {
        this.Game.logger.info('ShopManager::add', {shopId})

        const ShopData = ShopList[shopId];
        const newShop = new Shop(this.Game, ShopData); 
        // add building to the managed buildings array
        this.shops.push(newShop);

        return newShop;
    }
}