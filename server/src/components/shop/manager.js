// manager specific imports
import shopCommands from './commands';
import ShopList from 'config/gamedata/shops.json';
import {deepCopyObject} from '../../helper';
import Shop from './object';
import {
    SHOP_BUY,
    SHOP_SELL,
    SHOP_ITEM_PRICE,
    SHOP_GET_PRICE,
    SHOP_EVENT,
} from 'shared/actionTypes';

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
        // load map commands
        this.Game.commandManager.registerManager(shopCommands);
        console.log('SHOP MANAGER LOADED');
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
                return this.onShopBuy(socket, action);
                break;

            case SHOP_SELL:
                return this.onShopSell(socket, action);
                break;

            case SHOP_GET_PRICE:
                return this.onGetPrice(socket, action);
                break;
        }
    }

    /**
     * Handles shop purchase requests
     * @param  {Socket.io Socket} socket Socket making the request
     * @param  {Object}           action Redux action object
     */
    onShopBuy(socket, action) {
        const shop = this.get(action.payload.shop);

        if (!shop) {
            return;
        }

        shop.buyItem(socket.user.user_id, action.payload.item, action.payload.targetSlot);
    }

    /**
     * Handles shop sell requests
     * @param  {Socket.io Socket} socket Socket making the request
     * @param  {Object}           action Redux action object
     */
    onShopSell(socket, action) {
        const shop = this.get(action.payload.shop);

        if (!shop) {
            return;
        }

        shop.sellItem(socket.user.user_id, action.payload.item);
    }

    /**
     * Handles item price requests
     * @param  {Socket.io Socket} socket Socket making the request
     * @param  {object}           action Redux action object
     */
    onGetPrice(socket, action) {
        const shop = this.get(action.payload.shop);

        if (!shop) {
            return;
        }

        const price = shop.getItemPrice(action.payload.itemId, action.payload.priceType);

        this.Game.socketManager.dispatchToSocket(socket, {
            type: SHOP_ITEM_PRICE,
            payload: {
                itemId: action.payload.itemId,
                price,
            },
        });
    }

    /**
     * Get a shop byt fingerprint
     * @param  {String} fingerprint unigue fingerprint for the shop
     * @return {Promise}
     */
    get(fingerprint) {
        const shop = this.shops.find((obj) => obj.fingerprint === fingerprint);

        if (!shop) {
            return null;
        }

        return shop;
    }

    /**
     * Add a new shop to be managed
     * @param {String} shopId Shop ID of the shop to create.
     */
    add(shopId) {
        const ShopData = ShopList.find((obj) => obj.id === shopId);
        const newShop = new Shop(this.Game, deepCopyObject(ShopData));

        // load the shop items
        newShop.load();

        // add building to the managed buildings array
        this.shops.push(newShop);

        return newShop;
    }

    /**
     * Resupply all the shops, if they need it
     * @return {Void}
     */
    resupplyAll() {
        // resupply all the shops
        this.shops.forEach((shop) => {
            shop.resupply();
        });
    }

    /**
     * dispatch a shop event to a specific user
     * @param  {Socket.IO Socket} user_id  User ID of the player who should receive the event
     * @param  {String}           type     Event type
     * @param  {String}           message  Event message
     */
    eventToUser(user_id, type, message) {
        this.Game.logger.debug('Shop Event', {user_id, type, message});
        this.Game.socketManager.dispatchToUser(user_id, {
            type: SHOP_EVENT,
            payload: {
                type,
                message,
            },
        });
    }
}
