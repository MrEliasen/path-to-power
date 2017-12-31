import fs from 'fs';

/*
    {
        name: "",
        type: "weapon|armour|consumable",
        subtype: "[melee|ranged]|[body]|[food|drug]",
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

            // Type: armour
            damage_reduction: 123,

            // Type: consumable
            effect: [
                "effect-id"
            ],
            effect_duration: 123
        }
    }
*/
export default class Item {
    constructor(item) {
        this.loaded = new Promise((resolve, rejecte) => {
            Object.assign(this, item)

            this.loadItem(() => {
                resolve(this);
            });
        });
    }

    loadItem(callback) {
        callback()
    }

    consume() {
        // make sure the item is a consumable item
        if (this.type !== 'consumable') {
            return;
        }

        // check item durability
        if (!this.stats.durability) {
            return;
        }

        // reduce durability of the consumable
        this.durability(this.stats.durability - 1);

        // return the effect of the consumable
        return this.stats.effects;
    }

    use() {
        // on-use effects
    }

    // get the damage the weapon will deal
    get damage() {
        if (this.type !== 'weapon') {
            return 0;
        }

        return Math.floor(Math.random() * (this.stats.damage_max - this.stats.damage_min + 1)) + this.stats.damage_min;
    }

    get durability() {
        return this.stats.durability;
    }

    set durability(amount) {
        this.stats.durability = parseInt(amount);
    }
}

export function createItem(data) {
    return new Promise((resolve, rejecte) => {
        const newItem = new Item(data);

        newItem.loaded.then(() => {
            resolve(newItem);
        })
    })
}

export function initialiseItems(dispatch) {
    return new Promise((resolve, rejecte) => {
        const items = fs.readdirSync(`${__dirname}/../../data/items`);
        let loadeditems = 0;

        items.map((itemfile) => {
            let itemData = require(`${__dirname}/../../data/items/${itemfile}`);

            createItem(itemData).then((loadedItem) => {
                loadeditems++;

                dispatch({
                    type: 'SERVER_LOAD_ITEM',
                    payload: loadedItem
                })

                if (loadeditems === items.length) {
                    resolve();
                }
            })
        })
    })
}