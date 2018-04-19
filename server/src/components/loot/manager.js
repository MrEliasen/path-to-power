import lootTables from 'config/gamedata/loottables.json';
import {dice, deepCopyObject} from '../../helper';

/**
 * The Effect manager
 */
export default class LootManager {
    /**
     * Class constructor
     * @param  {Game} Game The main Game object
     */
    constructor(Game) {
        this.Game = Game;
        this.tables = deepCopyObject(lootTables);

        Game.logger.info('LootManager::constructor LOADED');
    }

    /**
     * Fetch a loot table by name
     * @param {String} tableName The name of the loot table
     */
    get(tableName) {
        const lootTable = this.tables.find((obj) => obj.name === tableName);

        if (!lootTable) {
            return null;
        }

        return lootTable;
    }

    /**
     * Generate a loot drop from the specified table
     * @param {String} tableName The name/key of the loot table
     * @param {Int|null} chance The loot drop chance, will overwrite the loot table default
     * @param {Int|array|null} drops The number of items to drop, will overwrite the loot table default
     */
    generate(tableName, chance = null, drops = null) {
        const lootTable = this.get(tableName);

        if (!lootTable) {
            return null;
        }

        const itemsDropped = [];
        const lootChance = chance || lootTable.chance;
        let lootDrops = drops || lootTable.drops;

        // if the supplied looDrops value is an array, we assume it a min-max array we need to pick a number between.
        if (Array.isArray(lootDrops)) {
            lootDrops = dice(lootDrops[0], lootDrops[1]);
        }

        while (lootDrops > 0) {
            lootDrops--;

            // If the loot chance is 100%, just skip
            if (lootChance < 100) {
                const dropLoot = Math.random() * 100;

                if (dropLoot > lootChance) {
                    return null;
                }
            }

            // calculate the total weight of all items, so we have our loot roll max value
            const total = lootTable.loot.reduce((accumulator, item) => {
                // calculate the weight (including other factors like "luck")
                const weight = item.weight;
                return accumulator + weight;
            }, 0);

            // Roll between 0 and the total, but start a 1 (required for the loot drop lookup)
            const roll = Math.random() * ((total / lootChance) * 100);

            // find which item is dropped.
            let counter = 0;
            const itemDrop = lootTable.loot.find((lootDrop) => {
                const weight = lootDrop.weight;
                counter = counter + weight;

                return (roll < counter);
            });

            if (!itemDrop) {
                return null;
            }

            const lootItem = this.Game.itemManager.add(itemDrop.id);

            // if the item is set to drop more than 1, set the amount
            // Only if the item is stackable however.
            if (Array.isArray(itemDrop.amount) && itemDrop.stats.stackable) {
                lootItem.setDurability(dice(itemDrop.amount[0], itemDrop.amount[1]));
            }

            itemsDropped.push(lootItem);
        }

        return itemsDropped;
    }
}
