// manager specific imports
import ShopList from '../../data/shops.json';
import Shop from './object';
import { SHOP_BUY, SHOP_SELL } from './types';

export default class ShopManager {
    constructor(Game) {
        this.Game = Game;
        this.shops = [];

        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
    }

    onDispatch(socket, action) {
        if (!action.payload.shop) {
            return;
        }

        switch(action.type) {
            case SHOP_BUY:
                this.get(action.payload.shop)
                    .then((shop) => shop.buyItem(socket.user.user_id, action.payload.index, action.payload.itemId))
                    .catch(this.Game.logger.error);
                break;
            case SHOP_SELL:
                this.get(action.payload.shop)
                    .then((shop) => shop.sellItem(socket.user.user_id, action.payload.index, action.payload.itemId))
                    .catch(this.Game.logger.error);
                break;
        }
    }

    add(shopId) {
        return new Promise((resolve, reject) => {
            this.Game.logger.info('ShopManager::add', {shopId})

            const ShopData = ShopList[shopId];
            const newShop = new Shop(this.Game, ShopData);

            // load the shop items
            newShop.load();

            // add building to the managed buildings array
            this.shops.push(newShop);

            resolve(newShop);
        });
    }
}