/*{
    id: "",
    name: "",
    type: "weapon|armour|consumable",
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

        // Type: consumable
        effect: [
            "effect-id"
        ],
        effect_duration: 123
    }
}*/

export default class Item {
    constructor(template = null, itemData, modifiers = {}) {
        this.template = template;
        Object.assign(this, itemData);
        Object.assign(this.stats, modifiers);
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
            name: this.name,
            type: this.type,
            subtype: this.subtype,
            stats: {...this.stats},
        }
    }

    /**
     * Retrives all the stats which differ from the template.
     * @return {Object} Object with stats
     */
    getModifiers() {
        const modifiers = {
            durability: this.stats.durability
        };
        /*const template = this.template;

        Object.keys(template.stats).map((stat_key) => {
            if (template.stats[stat_key] !== this.stats[stat_key]) {
                modifiers[stat_key] = this.stats[stat_key];
            }
        })*/

        return modifiers;
    }

    /**
     * Returns the number of items in the item (1 for non-stackable, otherwise durability)
     */
    getAmount() {
        return (this.stats.stackable ? this.stats.durability : 1);
    }

    /**
     * Sets the durability to the specified amount
     * @param {Number} amount
     */
    setDurability(amount) {
        this.stats.durability = amount;
    }

    /**
     * Adds the amount to the current item durability
     * @param {Number} amount
     */
    addDurability(amount) {
        this.stats.durability += amount;
    }
}