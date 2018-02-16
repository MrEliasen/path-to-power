import Promise from 'bluebird';

// manager specific imports
import shopCommands from './commands';
import ShopList from '../../data/shops.json';
import Shop from './object';
import {
    SHOP_BUY,
    SHOP_SELL,
    SHOP_ITEM_PRICE,
    SHOP_GET_PRICE,
} from '../../../shared/types';

/**
 * Shop Manager
 */
export default class ShopManager {
    /**
     * class constructor
     * @param  {Game} Game The Game object
     */
    constructor(Game) {
        this.Game = Game;
        this.shops = [];

        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
    }

    /**
     * Load all shop commands
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, rejecte) => {
            // load map commands
            this.Game.commandManager.registerManager(shopCommands);
            resolve();
        });
    }

    /**
     * Handles dispatches from the client, related to shops
     * @param  {Socket.IO Socket} socket Client who sent the dispatch
     * @param  {Object} action Reduc action object
     */
    onDispatch(socket, action) {
        if (!action.payload.shop) {
            return;
        }

        switch (action.type) {
            case SHOP_BUY:
                this.get(action.payload.shop)
                    .then((shop) => shop.buyItem(socket.user.user_id, action.payload.index, action.payload.item))
                    .catch(() => {});
                break;

            case SHOP_SELL:
                this.get(action.payload.shop)
                    .then((shop) => shop.sellItem(socket.user.user_id, action.payload.item))
                    .catch(() => {});
                break;

            case SHOP_GET_PRICE:
                this.get(action.payload.shop)
                    .then((shop) => {
                        shop.getItemPrice(action.payload.itemId, action.payload.priceType)
                            .then((price) => {
                                this.Game.socketManager.dispatchToSocket(socket, {
                                    type: SHOP_ITEM_PRICE,
                                    payload: {
                                        itemId: action.payload.itemId,
                                        price,
                                    },
                                });
                            })
                            .catch(() => {

                            });
                    })
                    .catch(() => {});
                break;
        }
    }

    /**
     * Get a shop byt fingerprint
     * @param  {String} fingerprint unigue fingerprint for the shop
     * @return {Promise}
     */
    get(fingerprint) {
        return new Promise((resolve, reject) => {
            const shop = this.shops.find((obj) => obj.fingerprint === fingerprint);

            if (!shop) {
                return reject(`No shop with fingerprint ${fingerprint} found.`);
            }

            resolve(shop);
        });
    }

    /**
     * Add a new shop to be managed
     * @param {String} shopId Shop ID of the shop to create.
     */
    add(shopId) {
        return new Promise((resolve, reject) => {
            //this.Game.logger.info('ShopManager::add', {shopId})

            const ShopData = ShopList.find((obj) => obj.id === shopId);
            const newShop = new Shop(this.Game, ShopData);

            // load the shop items
            newShop.load();

            // add building to the managed buildings array
            this.shops.push(newShop);

            resolve(newShop);
        });
    }

    /**
     * Resupply all the shops, if they need it
     * @return {Void}
     */
    resupplyAll() {
        return new Promise((resolve, reject) => {
            // update the pricing on items, with the priceRange array defined.
            // We update the templates as they will be used for the sell and buy prices
            this.Game.itemManager.updatePrices()
                .then(() => {
                    // resupply all the shops
                    this.shops.forEach((shop) => {
                        shop.resupply();
                    });

                    resolve();
                })
                .catch((err) =>{
                    this.Game.logger.error(err);
                    reject();
                });
        });
    }
}
