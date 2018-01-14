import { SHOP_UPDATE } from './types';

export default class Shop {
    constructor(Game, shopData) {
        this.Game = Game;
        Object.assign(this, shopData);
    }

    /**
     * Load the shop sell list
     * @return {Promise}
     */
    load() {
        if (!this.sell.selling) {
            return;
        }

        this.sell.list = this.sell.list.map((item) => {
            const newItem = this.Game.itemManager.add(item.id);
            newItem.shopQuantity = item.shopQuantity;

            return newItem;
        });
    }

    /**
     * Get the list of items the shop is selling
     * @param  {Boolean} toObject Whether to return a plain object for the client
     * @return {Array}
     */
    getSellList(toObject = false) {
        if (!this.sell.selling) {
            return [];
        }

        if (!toObject) {
            return this.sell.list;
        }

        return this.sell.list.map((item) => {
            return {
                id: item.id,
                name: item.name,
                quantity: item.shopQuantity
            }
        })
    }

    /**
     * Get the list of items the shop is buying
     * @param  {Boolean} toObject Whether to return a plain object for the client
     * @return {Array}
     */
    getBuyList(toObject = false) {
        if (!this.buy.buying) {
            return [];
        }

        if (!toObject) {
            return this.buy.list;
        }

        return this.buy.list.map((item) => {
            return {
                id: item.id,
                name: item.name,
                quantity: item.shopQuantity
            }
        })
    }

    /**
     * Exports the shop as a plain object
     * @return {Object}
     */
    toObject() {
        return {
            id: this.id,
            name: this.name,
            sell: {
                ...this.sell,
                list: this.getSellList(true)
            },
            buy: {
                ...this.buy,
                list: this.getBuyList(true)
            }
        }
    }

    /**
     * Purchase an item from the shop, and give it to the character
     * @param  {String} user_id User ID oh buyer
     * @param  {Number} index   The array index of the item they want to buy, on the shop selling list
     * @param  {String} itemId  The item ID to confirm the item is the one they where after
     * @return {Promise}
     */
    buyItem(user_id, index, itemId) {
        // get the character of the player
        this.Game.characterManager.get(user_id)
            .then((character) => {
                // check if shop is selling anything
                if (!this.sell.selling) {
                    return this.Game.eventToUser(user_id, 'error', 'They are not selling anything.');
                }

                // check if the shop has the item
                const item = this.selling.list[parseInt(index, 10)];
                if (!item) {
                    return this.Game.eventToUser(user_id, 'error', 'They do not appear to have that item anymore');
                }

                const price = (item.stats.price * this.sell.sellPricePercent);

                // check if the character has enough money
                if (character.stats.money < price) {
                    return this.Game.eventToUser(user_id, 'error', 'You do not have enough money.');
                }

                // check if the item is limited stock/has enough quantity
                if (item.shopQuantity < 1) {
                    return this.Game.eventToUser(user_id, 'error', 'They do not appear to have that item anymore');
                }

                // remove money from player
                character.stats.money = character.stats.money - price;

                // remove item/quantity from shop, if its not an unlimited item (999)
                if (item.shopQuantity < 999) {
                    item.shopQuantity = item.shopQuantity - 1;
                }

                // give item to player
                character.giveItem(this.Game.itemManager.add(item.id), 1);

                // update the client player object
                this.Game.characterManager.updateClient(character.user_id);

                // send event to client
                this.Game.eventToUser(character.user_id, 'success', `You have purchased 1x ${item.name} for ${price}`);

                // update the shop content for all in the grid (only if the item is limited quantity)
                if (item.shopQuantity < 999) {
                    this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: SHOP_UPDATE,
                        payload: {
                            shopId: this.id,
                            inventory: this.getSellList(true)
                        }
                    });
                }

                // remove the item from the shop, us quantity is 0
                if (item.shopQuantity <= 0) {
                    this.Game.itemManager.remove(item);
                }
            })
            .catch(this.Game.logger.error);
    }

    addToInventory(itemModifiers, amount, itemObj) {
        let addedItem = {
            ...itemModifiers,
            quantity: amount
        };

        // if the item is stackable, push it (incl modifiers) to the shop.
        if (itemObj.stats.stackable) {
            const listItem = this.sell.list.find((item) => item.id === itemObj.id);

            // if we find a matching item, increase the quantity.
            if (listItem) {
                listItem.quantity = listItem.quantity + amount;
                return {...listItem};
            }

            // remove durability from stackable items
            delete addedItem.durability;
        }

        this.sell.list.push(addedItem);
        return addedItem;
    }
}