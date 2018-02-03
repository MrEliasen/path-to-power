import Promise from 'bluebird';
import uuid from 'uuid/v4';
import { SHOP_UPDATE } from './types';

export default class Shop {
    constructor(Game, shopData) {
        this.Game = Game;
        Object.assign(this, shopData);

        // useful if you want to load a specific shop without going through the structure manager and map manager.
        this.fingerprint = uuid();
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
            fingerprint: this.fingerprint,
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

    sellItem(user_id, fingerprint) {
        // get the character of the player
        this.Game.characterManager.get(user_id)
            .then((character) => {
                const amount = 1;

                // check if shop is buying anything
                if (!this.buy.buying) {
                    return this.Game.eventToUser(user_id, 'error', 'They are not interested in buying anything.');
                }

                // get the item from the inventory
                const index = character.inventory.findIndex((obj) => obj.fingerprint === fingerprint);

                // check if the item exists
                if (index === -1) {
                    return this.Game.eventToUser(user_id, 'error', 'Invalid item.');
                }

                // get the Item Object from the inventory
                const item = character.inventory[index];

                // check if the shop is only interested in specific items, and if its on the list
                if (this.buy.list.length && !this.buy.list.includes(item.id)) {
                    return this.Game.eventToUser(user_id, 'error', 'They are not interested in buying that item.');
                }

                // check the item is one the shop wants to buy
                if (this.buy.ignoreType.includes(item.type) || this.buy.ignoreSubtype.includes(item.subtype)) {
                    return this.Game.eventToUser(user_id, 'error', 'They are not interested in buying this type of item.');
                }

                // make sure, if its a stackable item, have enough to sell.
                if (item.stats.stackable) {
                    if (item.stats.durability < amount) {
                        return this.Game.eventToUser(user_id, 'error', 'You do not have any more of that item.');
                    }
                }

                // will hold the item, which was sold
                let soldItem;
                let pricePerUnit = item.stats.price * this.buy.buyPricePercent;

                // remove item from inventory/reduce amount
                if (item.stats.stackable) {
                    soldItem = this.Game.itemManager.add(item.id, {durability: amount});
                    item.removeDurability(amount);

                    // if the item has 0 durability, remove it
                    if (item.stats.durability <= 0) {
                        this.Game.itemManager.remove(character, item);
                    }
                } else {
                    soldItem = character.inventory.splice(index, 1)[0];
                }

                // add money to character
                character.stats.money = (character.stats.money + (amount * pricePerUnit));

                // add item to shop inventory (if resell is enabled)
                if (this.buy.resell) {
                    this.addToInventory(soldItem);
                }

                // let the player know they sold the item
                this.Game.eventToUser(user_id, 'success', `You sold 1x ${soldItem.name} for ${(amount * pricePerUnit)}`);

                // update client character object
                this.Game.characterManager.updateClient(character.user_id);

                // update grid, with the shop update
                this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                    type: SHOP_UPDATE,
                    payload: {
                        shopId: this.id,
                        inventory: this.getSellList(true)
                    }
                });
            })
            .catch(() => {});
    }

    addToInventory(itemObj, amount = null) {
        let inventoryItem;

        // check if item is stackable, and if so, see if we have that item in the inventory already
        if (itemObj.stats.stackable) {
            amount = amount || itemObj.stats.durability;

            inventoryItem = this.sell.list.find((obj) => obj.id === itemObj.id);

            if (inventoryItem) {
                inventoryItem.shopQuantity = inventoryItem.shopQuantity + amount;
            } else {
                // set the amount of the item to the correct amount, before adding to the inventory
                itemObj.shopQuantity = amount;
                this.sell.list.push(itemObj)
            }
        } else {
            // check if the item is already sold as a unlimited quantity item.
            inventoryItem = this.sell.list.find((obj) => obj.id === itemObj.id && obj.shopQuantity === -1);
            // if once exists, delete the player item
            if (inventoryItem) {
                return;
            }

            // check if we have other items with the same durability, then we can stack those.
            inventoryItem = this.sell.list.find((obj) => obj.id === itemObj.id && obj.stats.durability === itemObj.stats.durability);

            // stack the items if found
            if (inventoryItem) {
                inventoryItem.shopQuantity = inventoryItem.shopQuantity + 1;
                return;
            }

            // otherwise push the new item to the stack 
            // set quantity to 1, since its a new item
            itemObj.shopQuantity = amount || 1;
            // otherwise, add it to the list
            this.sell.list.push(itemObj);
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
                const itemIndex = parseInt(index, 10);
                const item = this.sell.list[itemIndex];
                if (!item) {
                    return this.Game.eventToUser(user_id, 'error', 'They do not appear to have that item anymore');
                }

                // make sure the item is what they where afte, in case the array has shifted
                if (item.id !== itemId) {
                    return this.Game.eventToUser(user_id, 'error', 'The item you where after is no longer available.');
                }

                const itemTemplate = this.Game.itemManager.getTemplate(item.id);

                // Check the template exists
                if (!itemTemplate) {
                    return this.Game.eventToUser(user_id, 'error', 'Invalid item. The item might no longer be available.');
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

                // remove item/quantity from shop, if its not an unlimited item (-1)
                if (item.shopQuantity !== -1) {
                    item.shopQuantity = item.shopQuantity - 1;
                }

                // give item to player
                character.giveItem(this.Game.itemManager.add(item.id), 1);

                // update the client player object
                this.Game.characterManager.updateClient(character.user_id);

                // send event to client
                this.Game.eventToUser(character.user_id, 'success', `You have purchased 1x ${itemTemplate.name} for ${price}`);

                // update the shop content for all in the grid (only if the item is limited quantity)
                if (item.shopQuantity !== -1) {
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
                    this.sell.list.splice(itemIndex, 1);
                }
            })
            .catch((err) => {
                this.Game.logger.error(err);
            });
    }
}