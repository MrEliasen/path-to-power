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
    constructor(Game, itemData) {
        this.Game = Game;
        Object.assign(this, itemData);
    }

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
}