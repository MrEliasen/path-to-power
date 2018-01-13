export default class Character {
    constructor(Game, character) {
        this.Game = Game;
        Object.assign(this, character);

        // the character objest of the characters who are currently aiming at this character
        this.targetedBy = [];

        // the character object of the current targed character
        this.target = null;

        // create the inventory and equipped objects
        if (!this.inventory) {
            this.inventory = [];
        }
        if (!this.equipped) {
            this.equipped = {};
        }

        // if the character is new, they won't have stats, set the default here.
        if (!this.stats) {
            this.stats = {
                health: 100,
                health_max: 100,
                money: 0,
                bank: 200
            }
        }

        // if the location does not have an X or Y coordinate, set the location to the
        // map spawn location
        if (!this.location.x || !this.location.y) {
            const spawn = this.Game.mapManager.getSpawn(this.location.map);
            this.location.x = spawn.x;
            this.location.y = spawn.y;
        }
    }

    /**
     * generates the grid "room" ID of the characters currect location
     * @return {String}
     */
    getLocationId() {
        return `${this.location.map}_${this.location.y}_${this.location.x}`;
    }

    /**
     * Updates the character location
     * @param  {String} map  Map ID
     * @param  {Number} x   East coordinate
     * @param  {Number} y   North coordinate
     */
    updateLocation(map, x, y) {
        map = map || this.location.map;
        this.location = { map, x, y };
    }

    /**
     * sets the character inventory items to list of items passed
     * @param {Array} items array of items references from the itemManager.
     */
    setInventory(items) {
        this.inventory = items;
    }

    /**
     * Export a plain object of the important character data, to be dispatched to the client.
     * @return {Object} Character data
     */
    exportToClient() {
        return {
            user_id: this.user_id,
            name: this.name,
            inventory: this.inventory,
            equipped: this.equipped,
            stats: this.stats,
            location: this.location
        }
    }

    /**
     * Sets the target of the character and gridlocks the target (while clearing gridlock on previous target)
     * @param {[type]} targetCharacter [description]
     */
    setTarget(targetCharacter) {
        // release the gridlock of the current target, if set
        this.releaseTarget()

        // and gridlock them
        targetCharacter.gridLock(this);

        // set the new target
        this.target = targetCharacter;
    }

    /**
     * Removes gridlock from target
     * @return {[type]} [description]
     */
    releaseTarget() {
        // release the gridlock of the current target, if set
        if (this.target) {
            this.target.gridRelease(this.user_id);
        }

        this.target = null;
    }

    /**
     * Checks if the user is targeted by the user specified
     * @param  {String}  user_id user id
     * @return {Boolean}
     */
    isTargetedBy(user_id) {
        return this.targetedBy.find((user) => user.user_id === user_id) ? true : false;
    }

    /**
     * Adds the user id to the gridlock array
     * @param  {Character Obj} character  the character objest of the character gridlocking the character.
     */
    gridLock(character) {
        if (this.targetedBy.findIndex((obj) => obj.user_id === character.user_id) === -1) {
            this.targetedBy.push(character);
        }
    }

    /**
     * Removes a player from the gridlock, from when they have used /aim
     * @param  {String} user_id User ID
     */
    gridRelease(user_id) {
        const playerIndex = this.targetedBy.findIndex((obj) => obj.user_id === user_id);

        if (playerIndex === -1) {
            return;
        }

        this.targetedBy.splice(playerIndex, 1);
    }

    /**
     * Will kill the player and reset their location to the maps spawn point
     * @param  {Map object} currentMap  The Map Object of the current map
     * @return {object}                 Object with items and cash the player dropped
     */
    kill(currentMap) {
        const items = [...this.inventory];
        const equipped = {...this.equipped};
        const cash = this.stats.money;

        // drop all items and cash
        this.equipped = {};
        this.inventory = [];
        this.stats.money = 0;
        this.targetedBy = [];
        this.stats.health = this.stats.health_max;

        // reset location to the map spawn location
        this.location.x = currentMap.spawn.x;
        this.location.y = currentMap.spawn.y;

        // TODO: add reputation penalty when getting killed.

        if (equipped) {
            Object.keys(equipped).map((slot) => {
                if (equipped[slot] && equipped[slot].id) {
                    items.push(equipped[slot]);
                }
            })
        }

        return {
            items,
            cash
        }
    }

    /**
     * Returns the damage of the equipped ranged weapon + ammo, and reduces durability of ammo.
     * @param  {Object} itemList List of all game items
     * @return {Object}          the damage, -1 if the weapon cannot be fired.
     */
    fireRangedWeapon(itemList) {
        const damage = this.getWeaponDamage('ranged', itemList);

        if (!this.hasAmmo()) {
            return -1;
        }

        // reduce ammo durability
        this.equipped.ammo.durability = this.equipped.ammo.durability - 1;

        // remove ammo if durability is 0
        if (this.equipped.ammo.durability <= 0) {
            this.equipped.ammo = null;
        }

        return damage;
    }

    /**
     * Checks if the player any any ammo equipped, and if there are any rounds left.
     * @return {Boolean}
     */
    hasAmmo() {
        const equippedAmmo = this.equipped['ammo'];

        if (!equippedAmmo) {
            return false;
        }

        if (equippedAmmo.durability <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Gets the damage bonus of the equipped ammo
     * @return {Number}
     */
    getAmmoDamage(itemList) {
        if (!this.hasAmmo()) {
            return -1;
        }

        return itemList[this.equipped.ammo.id].stats.damage_bonus;
    }

    /**
     * Generates the weapon damage, based on the type equipped.
     * @param  {String} slot     Any of the equipped weapon slots (melee|ranged)
     * @param  {Object} itemList List of all game items
     * @return {Number}          Damage of the weapon
     */
    getWeaponDamage(slot, itemList) {
        const equippedItem = this.equipped[slot];
        let bonusDamage = 0;

        if (!equippedItem) {
            return 0;
        }

        const item = itemList[equippedItem.id];

        if (slot === 'ranged') {
            bonusDamage = this.getAmmoDamage(itemList);
        }

        return Math.floor(Math.random() * (item.stats.damage_max - item.stats.damage_min + 1)) + item.stats.damage_min + bonusDamage;
    }

    /**
     * Unequips slotted item, and adds it to the inventory
     * @param  {String} slot  The equipped slot to unequip
     * @return {Boolean}      True on success.
     */
    unEquip(slot) {
        if (!slot) {
            return false;
        }

        this.equipped[slot].slot = null;
        this.equipped[slot] = null;
        return true;
    }

    /**
     * Equips selected item from inventory, moving the other item (if any) to the inventory.
     * @param  {Number} inventoryIndex The inventory array index of the item to equip
     * @return {Boolean}               True on success, false otherwise.
     */
    equip(inventoryIndex) {
        const item = this.inventory[inventoryIndex];

        if (!item) {
            return false;
        }

        if (!item.stats.equipable) {
            return false;
        }

        // NOTE: change this line of code, should you wish to update which items can be equipped
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

            case 'ammo':
                slot = 'ammo';
                break;

            default:
                return false;

        }

        // equip the item
        item.slot = slot;
        this.equipped[slot] = item;
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
     * Selects a random item from the inventory to drop (used primarily for fleeing)
     * @param  {Object} itemList Game items list
     * @return {Mixed}           Null if no item is found, otherwise an Item Object of the inventory item.
     */
    dropRandomItem(itemList) {
        // do we have items in the inventory
        if (!this.inventory.length) {
            return null;
        }

        // pick a random item
        const item = this.inventory[Math.floor(Math.random() * this.inventory.length)];

        if (!item) {
            return null;
        }

        // return the dropped item
        return this.dropItem(itemList[item.id].name.toLowerCase(), 1, itemList, true);
    }

    /**
     * Remove the first occurance of a given item from the inventory, based on name.
     * @param  {String} itemName    The name of the item (or first couple of letters) to search for
     * @param  {Number} amount      The number of a given item to drop (stackable items only)
     * @param  {Boolean} isFleeing  If the drop is caused by fleeing, random the amount dropped, if its a stackable item.
     * @return {Object}             The item (with amount if stackable) which has been removed from the inventory.
     */
    dropItem (itemName, amount = 1, isFleeing = false) {
        amount = parseInt(amount);
        // get the first matching items from the inventory
        let itemIndex = this.inventory.findIndex((item) => item.name.toLowerCase().indexOf(itemName) === 0);

        // If no item was found
        if (itemIndex === -1) {
            return null;
        }

        // get the matching item object from the inventory
        let inventoryItem = this.inventory[itemIndex];

        // If the item is not stackable, just delete the item from the inventory, can return it
        if (!inventoryItem.stats.stackable) {
            return this.inventory.splice(itemIndex, 1)[0];
        }

        // Check if the character has enough of said item to drop
        if (inventoryItem.stats.durability < amount) {
            return null;
        }

        // if the character drop the item because of fleeing, random the amount, based on what they have
        if (isFleeing) {
            amount = Math.floor(Math.random() * inventoryItem.stats.durability) + 1;
        }

        // if there is not 0 items left, delete the item completely
        if ((inventoryItem.stats.durability - amount) <= 0) {
            return this.inventory.splice(itemIndex, 1)[0];
        }

        // reduce the number of said item, in the inventory
        inventoryItem.removeDurability(amount);

        // return a new item, with the dropped amount
        return this.Game.itemManager.add(inventoryItem.id, { durability: amount });
    }

    /**
     * Gives an item to the character
     * @param  {Item Object} itemObj The item object for the item which will be given to the character
     * @param  {Number} amount       The number of a given item to give to the player (non-stackable as well)
     */
    giveItem(itemObj, amount = null) {
        // check if item is stackable, and if so, see if we have that item in the inventory already
        if (itemObj.stats.stackable) {
            amount = amount || itemObj.stats.durability;

            const inventoryItem = this.inventory.find((obj) => obj.id === itemObj.id);

            if (inventoryItem) {
                inventoryItem.addDurability(amount);
                this.Game.itemManager.remove(itemObj);
            } else {
                // set the amount of the item to the correct amount, before adding to the inventory
                itemObj.setDurability(amount);
                this.inventory.push(itemObj)
            }
        } else {
            this.inventory.push(itemObj);

            // if we just added one, kill it here.
            if (!amount) {
                return;
            }

            // if its non-stackable, we have to create the item several items.
            for (var i = amount - 1; i > 0; i--) {
                this.giveItem(this.Game.itemManager.add(itemObj.id), 1);
            }
        }
    }

    /**
     * Deal damage to the player
     * @param  {Number}  damage      Amount of damage to deal
     * @param  {Boolean} ignoreArmor Whether armor should reduce the damange
     * @return {Object}              damageBlocked, damageDealt, healthLeft, durabilityLeft, armorRuined.
     */
    dealDamage(damage, ignoreArmor = false) {
        let armor = 0;
        let durability = 0;
        let health = this.stats.health;
        let armorRuined = false;

        if (!ignoreArmor && this.equipped.armor) {
            durability = this.equipped.armor.durability;
            armor = this.equipped.armor.stats.damage_reduction;
        }

        // Either you block the damage dealt if it's lower than your armor/durability combo
        // Or you block whatever you can afford to from either low armor or low durability
        let damageBlocked   = Math.min(damage, armor, durability);
        // The damage dealt after the block, but keeping it at 0 if going negative
        let damageDealt     = Math.max(0, damage - damageBlocked);
        // New health, but keeping it at 0 if going negative
        let healthLeft       = Math.max(0, health - damageDealt);
        // Now full damage as you said, but keeping it at 0 if going negative
        let durabilityLeft   = Math.max(0, durability - damage);

        // update the durability of the equipped armor
        if (!ignoreArmor && this.equipped.armor) {
            this.equipped.armor.durability = durabilityLeft;
        }

        this.stats.health = healthLeft;

        // if the armor durability is 0, remove the item as its broken.
        if (!durabilityLeft && durability) {
            armorRuined = true;
            this.Game.itemManager.remove(this.equipped.armor);
        }

        return {
            damageBlocked,
            damageDealt,
            healthLeft,
            durabilityLeft,
            armorRuined
        };
    }
}