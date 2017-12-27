// example of an item available in the game
exports.items = {
    // defaule/placeholder item
    "item-id" : {
        name: "",
        type: "weapon|armour|consumable",
        subtype: "[melee|ranged]|[body]|[food|drug]",
        stat_price: 123,
        stat_stackable: true|false,
        // armour: it would be max damage item can soak before getting ruined/useless
        // consumables: it would be the number of uses left
        // weapons: TBD
        stat_durability: 123,

        // Type: weapon
        stat_damage_min: 123,
        stat_damage_max: 321,

        // Type: armour
        stat_damage_reduction: 123,

        // Type: consumable
        stat_effect: [
            "effect-id"
        ],
        stat_effect_duration: 123
    },
    "apple" : {
        name: "Red Apple",
        type: "consumable",
        subtype: "food",
        stat_price: 2,
        stat_stackable: true,
        stat_durability: 1
    },
    "sword" : {
        name: "Long Sword",
        type: "weapon",
        subtype: "melee",
        stat_price: 12,
        stat_stackable: false,
        stat_durability: 100,
        stat_damage_min: 3,
        stat_damage_max: 7
    },
}

// example of player inventory object
const inventory = {
    // stackable item
    "apple" : {
        durability: 5, // durability left on item
    },

    // non-stackable item
    "sword" : {
        "item-uuid": {
            durability: 123 // durability left on item
        }
    }
}