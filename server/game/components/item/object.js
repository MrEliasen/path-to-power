import uuid from 'uuid/v4';
import {dice} from '../../helper';

/*{
    id: "",
    name: "",
    description: "",
    type: "weapon|armour|consumable|trash",
    subtype: "[melee|ranged|ammo]|[body]|[food|drug]",
    stats: {
        equipable: true|false,
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

/**
 * Item Object class
 */
export default class Item {
    /**
     * class constructor
     * @param  {Game} Game        The Game Object
     * @param  {Object} itemData  The item template object
     * @param  {Object} modifiers Item modifiers
     */
    constructor(Game, itemData, modifiers = {}) {
        Object.assign(this, itemData);
        Object.assign(this.stats, modifiers);
        this.Game = Game;
        this.fingerprint = uuid();
        this.shufflePrice = this.shufflePrice.bind(this);
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
            hasUseEffect: (this.stats.useEffect ? true : false),
        };
    }

    /**
     * Retrives all the stats which differ from the template.
     * @return {Object} Object with stats
     */
    getModifiers() {
        // TODO: optimise this so it is not a manually set list
        const modifiers = {
            durability: parseInt(this.stats.durability, 10),
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
        this.stats.durability = parseInt(amount, 10);
    }

    /**
     * Adds the amount to the current item durability
     * @param {Number} amount
     */
    addDurability(amount) {
        this.stats.durability = parseInt(this.stats.durability, 10) + parseInt(amount, 10);
    }

    /**
     * Removes the amount to the current item durability
     * @param {Number} amount
     */
    removeDurability(amount) {
        this.stats.durability = parseInt(this.stats.durability, 10) - parseInt(amount, 10);
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
        const effects = this.Game.effectManager.apply(character, this.stats.useEffect.id, this.stats.useEffect.modifiers, this);

        if (!effects) {
            return;
        }

        // check if the use effect, reduces item durability
        if (this.stats.useEffect.modifiers.ignoreDurability) {
            return;
        }

        // reduce the durability of the item
        this.removeDurability(1);

        // if the item has no more uses, remove it.
        if (this.stats.durability <= 0) {
            this.Game.itemManager.remove(character, this);
        }

        // update the users inventory on the client side.
        this.Game.characterManager.updateClient(character.user_id, 'inventory');
    }

    /**
     * Will update the price of a given item, if a price range is available
     * @return {Number} The new price
     */
    shufflePrice() {
        if (!this.stats.priceRange || this.stats.priceRange.length !== 3) {
            return this.stats.price;
        }

        this.stats.price = dice(this.stats.priceRange[1], this.stats.priceRange[2]);
        return this.stats.price;
    }
}
