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

    takeItem(inventoryIndex, amount = 1, itemList) {
        let selectedItem = this.inventory[inventoryIndex];
        const item = itemList[selectedItem.id];

        if (!item.stats.stackable) {
            return this.inventory.splice(inventoryIndex, 1)[0];
        }

        // check if they have enough of the specific item to drop
        if (selectedItem.durability < amount) {
            return null;
        }

        const takenItem = {...selectedItem};
        takenItem.durability = amount;

        // if the item (after accounting for the amount to drop), is 0, remove it
        selectedItem.durability = selectedItem.durability - amount;

        if (selectedItem.durability <= 0) {
            this.inventory.splice(inventoryIndex, 1);
        }

        return takenItem;
    }

    dropItem (itemName, amount = 1, itemlist) {
        amount = parseInt(amount);
        // get the first matching items from the inventory
        let itemIndex = this.inventory.findIndex((inventoryItem) => itemlist[inventoryItem.id].name.toLowerCase().indexOf(itemName) === 0);

        // If no item was found
        if (itemIndex === -1) {
            return null;
        }

        // get the matching item object from the inventory
        let inventoryItem = this.inventory[itemIndex];

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
            const inventoryItemCount = this.inventory.length;
            let   itemIndex;

            for (var i = 0; i < inventoryItemCount; i++) {
                if (this.inventory[i].id === itemObj.id) {
                    itemIndex = i;
                    break;
                }
            }

            if (itemIndex || itemIndex === 0) {
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