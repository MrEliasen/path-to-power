import uuid from 'uuid/v4';
/*{
    id: "",
    name: "",
    type: "weapon|armour|consumable|trash",
    subtype: "[melee|ranged|ammo]|[body]|[food|drug]",
    stats: {
        price: 123,
        stackable: true|false,
        // armour: it would be max damage item can soak before getting ruined/useless
        // consumables: it would be the number of uses left
        // weapons: TBD
        durability: 123,
        durability_max: 123, // for non-consumable

        // Type: weapon
        damage_min: 123,
        damage_max: 321,

        // subtype: ammo
        damage_bonus: 123,

        // Type: armour
        damage_reduction: 123,

        // Subtype: drug
        priceRange: [Mean, Min, Max]

        // Type: consumable
        useEffect: "effectId/name"
    }
}*/

export default class Item {
    constructor(Game, itemData, modifiers = {}) {
        Object.assign(this, itemData);
        Object.assign(this.stats, modifiers);
        this.Game = Game;

        this.fingerprint = uuid();
    }

    /**
     * removes the item from the game
     */
    destroy() {
        this.remove = true;
    }

    /**
     * Converts the items from an Item Object, to a plain text object.
     * @return {Object}
     */
    toObject() {
        return {
            id: this.id,
            description: this.description,
            fingerprint: this.fingerprint,
            name: this.name,
            type: this.type,
            subtype: this.subtype,
            stats: {...this.stats},
            equipped_slot: this.equipped_slot,
            hasUseEffect: (this.stats.useEffect ? true : false)
        }
    }

    /**
     * Retrives all the stats which differ from the template.
     * @return {Object} Object with stats
     */
    getModifiers() {
        // TODO: optimise this so it is not a manually set list
        const modifiers = {
            durability: parseInt(this.stats.durability, 10)
        };

        return modifiers;
    }

    /**
     * Returns the number of items in the item (1 for non-stackable, otherwise durability)
     */
    getAmount() {
        return (this.stats.stackable ? parseInt(this.stats.durability, 10) : 1);
    }

    /**
     * Sets the durability to the specified amount
     * @param {Number} amount
     */
    setDurability(amount) {
        this.stats.durability = parseInt(amount,10);
    }

    /**
     * Adds the amount to the current item durability
     * @param {Number} amount
     */
    addDurability(amount) {
        this.stats.durability = parseInt(this.stats.durability, 10) + parseInt(amount,10);
    }

    /**
     * Removes the amount to the current item durability
     * @param {Number} amount
     */
    removeDurability(amount) {
        this.stats.durability = parseInt(this.stats.durability, 10) - parseInt(amount,10);
    }

    /**
     * Use the item, if the item allows
     */
   use(character) {
        // check if the item has an effect, if not, its not useable
        if (!this.stats.useEffect) {
            return;
        }

        // apply the item use effect
        this.Game.effectManager.apply(character, this.stats.useEffect.id, this.stats.useEffect.modifiers || {})
            .then((effect) => {
                // reduce the durability of the item
                this.removeDurability(1);

                // if the item has no more uses, remove it.
                if (this.stats.durability <= 0) {
                    this.Game.itemManager.remove(character, this);
                }

                // update the users inventory on the client side.
                this.Game.characterManager.updateClient(character.user_id, 'inventory');
            })
            .catch((err) => {
                return;
            });
    }
}