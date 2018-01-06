class Character {
    constructor(character) {
        Object.assign(this, character);

        // each ID in the gridlock, are players who are currently aiming at this character
        this.gridLocked = [];

        if (!this.inventory) {
            this.inventory = [];
        }
        if (!this.equipped) {
            this.equipped = {};
        }
    }

    /**
     * Adds the user id to the gridlock array
     * @param  {String} user_id  the user id of the player gridlocking the character.
     */
    gridLock(user_id) {
        if (!this.gridLocked.includes(user_id)) {
            this.gridLocked.push(user_id);
        }
    }

    gridRelease(user_id) {
        console.log(this.user_id, ' => ', user_id);
        const playerIndex = this.gridLocked.findIndex((playerId) => playerId === user_id);

        if (playerIndex === -1) {
            return false;
        }

        this.gridLocked.splice(playerIndex, 1);
        return true;
    }

    /**
     * Equips selected item from inventory, moving the other item (if any) to the inventory.
     * @param  {Number} inventoryIndex The inventory array index of the item to equip
     * @param  {Object} itemList       The list of game items 
     * @return {Boolean}               True on success, false otherwise.
     */
    equipItem(inventoryIndex, itemList) {
        const selectedItem = this.inventory[inventoryIndex];
        const item = itemList[selectedItem.id];
        const equipped = {...this.equipped};

        if (!item) {
            return false;
        }

        // NOTE: change this line of code, should you wish to update which items can be equipped
        if (!['weapon', 'armour'].includes(item.type)) {
            return false;
        }

        // Check which slot the item will be equipped into
        let slot;
        switch (item.subtype) {
            case 'ranged':
                slot = 'ranged';
                break;

            case 'melee':
                slot = 'melee';
                break;

            case 'body':
                slot = 'armor';
                break;

            default:
                return false;

        }

        // equip the item
        this.equipped[slot] = {...selectedItem};
        // take the previously equipped item, and replace the newly equipped item in the inventory.
        if (equipped[slot]) {
            this.inventory[inventoryIndex] = {...equipped[slot]};
        } else {
        // if no item was equipped already, simply remove it from the inventory.
            this.inventory.splice(inventoryIndex, 1);
        }

        return true;
    }

    /**
     * Removes the item (or reduces the number of a given item if stackable) from the character inventory
     * @param  {Number} inventoryIndex      Array index (in the character inventory) of the item to remove
     * @param  {Number} amount              The amount of a given item to remove (only for stackable items)
     * @param  {Object} itemList            The full list of items of the game
     * @return {Object}                     Returns the item removed from the inventory, null if non is found.
     */
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

    /**
     * Remove the first occurance of a given item from the inventory, based on name.
     * @param  {String} itemName    The name of the item (or first couple of letters) to search for
     * @param  {Number} amount      The number of a given item to drop (stackable items only)
     * @param  {Object} itemlist    The list of all items in the game
     * @return {Object}             The item (with amount if stackable) which has been removed from the inventory.
     */
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

    /**
     * Gives an item to the character
     * @param  {Item Object} itemObj The item object for the item which will be given to the character
     * @param  {Number} amount       The number of a given item to give to the player (non-stackable as well)
     */
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
}

export default Character;