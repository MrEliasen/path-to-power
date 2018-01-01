import uuid from 'uuid/v4';

class Character {
    constructor(character) {
        Object.assign(this, character);

        if (!this.inventory) {
            this.inventory = [];
        }
    }

    // Location
    getLocation() {
        return this.location;
    }

    setLocation(map, x, y) {
        this.location = { map, x, y };
        return this.location;
    }

    // Inventory
    getInventory() {
        return this.inventory;
    }

    dropItem (itemName, amount = 1, itemlist) {
        amount = parseInt(amount);
        const inventoryItemCount = this.inventory.length - 1;
        let   inventoryItem;
        let   itemIndex;

        // Loop inventory to find item, by name
        for (var i = inventoryItemCount; i >= 0; i--) {
            if (itemlist[this.inventory[i].id].name.toLowerCase() === itemName) {
                // check if item is equipped
                if (!this.inventory[i].equipped) {
                    // return the array index of the item, in the inventory 
                    // and to make life easier, create reference to the specific item in the inventory
                    itemIndex = i;
                    inventoryItem = this.inventory[i];
                    break;
                }
            }
        }

        // If no item was found
        if (!inventoryItem) {
            return null;
        }

        // Get the item object from the store
        const item = {...itemlist[inventoryItem.id]};

        // If the item is not stackable, just delete the item from the iventory, can return it
        if (!item.stats.stackable) {
            this.inventory.splice(itemIndex, 1);
            return item;
        }

        // Check if the character has enough of said item to drop
        if (inventoryItem.durability < amount) {
            return null;
        }

        // reduce the number of said item, in the inventory
        item.stats.durability = amount
        inventoryItem.durability = inventoryItem.durability - amount;

        // if there is not 0 items left, delete the item completely
        if (inventoryItem.durability <= 0) {
            this.inventory.splice(itemIndex, 1);
        }

        return item;
    }

    giveItem(itemObj, amount = 1) {
        amount = parseInt(amount);

        // check if item is stackable, and if so, see if we have that item in the inventory already
        if (itemObj.stats.stackable) {
            const inventoryItemCount = this.inventory.length - 1;
            let   itemIndex;

            for (var i = inventoryItemCount; i >= 0; i--) {
                if (this.inventory[i].id === itemObj.id) {
                    itemIndex = i;
                    break;
                }
            }

            if (itemIndex) {
                this.inventory[itemIndex].durability = (this.inventory[itemIndex].durability || 0) + amount;
            } else {
                this.inventory.push({
                    id: itemObj.id,
                    durability: amount
                })
            }
        } else {
            for (var i = amount; i > 0; i--) {
                this.inventory.push({
                    id: itemObj.id,
                    durability: itemObj.stats.durability
                })
            }
        }
    }

    // Stats
    getStats() {
        return this.stats;
    }

    getStat(stat_name) {
        return this.stats[stat_name];
    }

    setStat(stat_name, value) {
        this.stats[stat_name] = value;
        return this.stats[stat_name];
    }
}

export default Character;