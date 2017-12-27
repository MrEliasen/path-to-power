const itemList = require('../assets/items').items;
const uuid = require('uuid/v4');
const { getInventory, setInventory } = require('./character');

exports.getItem = function(itemId, callback) {
    callback(itemList[itemId] || null);
}

exports.giveItem = function(itemId, amount = 1, userId, callback) {
    getInventory(userId, function(inventory) {
        const itemInfo = itemList[itemId];

        if (!itemInfo) {
            return; // send an error back to the client.
        }

        if (!inventory[itemId]) {
            inventory[itemId] = {};
        }

        // check if the item is stackable or not
        if (itemInfo.stat_stackable) {
            inventory[itemId].durability = (inventory[itemId].durability || 0) + parseInt(amount);
        } else {
            for (var i = amount; i > 0; i--) {
                inventory[itemId][ uuid() ] = {
                    durability: itemInfo.stat_durability
                }
            }
        }

        setInventory(userId, inventory, function(savedInventory) {
            callback(savedInventory);
        })
    })
}

exports.consume = function(itemId, userId) {
    // check if the player has the specific item in their inventory
    getInventory(userId, function(inventory) {
        if (!inventory || !inventory[itemId]) {
            return; // send an error back to the client.
        }

        // get the item effects
        const itemInfo = itemList[itemId];

        if (!itemInfo || itemInfo.type !== 'consumable') {
            return; // send an error back to the client.
        }

        // check item durability
        if (!inventory[itemId].durability) {
            return; // send an error back to the client.
        }

        // reduce durability of the consumable
        inventory[itemId].durability = inventory[itemId].durability - 1;

        // if durability is 0, remove item completely
        if (inventory[itemId].durability < 1) {
            delete inventory[itemId];
        }

        // apply effect of the item.
        setInventory(userId, inventory, function(savedInventory) {
            callback(savedInventory);
        })
    })
}

