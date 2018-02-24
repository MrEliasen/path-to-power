import Promise from 'bluebird';

// manager specific imports
import ItemModel from './model';
import ItemList from '../../data/items.json';
import Item from './object';
import ItemCommands from './commands';
import {ucfirst} from '../../helper';

/**
 * Item Manager
 */
export default class ItemManager {
    /**
     * Class constructor
     * @param  {Game} Game The main Game object
     */
    constructor(Game) {
        this.Game = Game;
        // list of all items in the game, for reference
        this.templates = {};
        // dropped items, references items from the items list
        this.dropped_items = {};
    }

    /**
     * Load item templates
     * @return {Promise}
     */
    init() {
        return new Promise(async (resolve, rejecte) => {
            ItemList.map((itemData) => {
                this.templates[itemData.id] = new Item(null, itemData);
            });

            // register the commands
            this.Game.commandManager.registerManager(ItemCommands);

            // set the initial item prices.
            await this.updatePrices()
                .then(() =>{
                    resolve(ItemList.length);
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                });
        });
    }

    /**
     * Get a list of items at the grid location
     * @param  {String} map        Map Id
     * @param  {Number} x
     * @param  {Number} y
     * @param  {Boolean} toClient  If true, will return a new object with minimal info (for clients)
     * @return {Array}     Array of items
     */
    getLocationList(map_id, x, y, toClient = false) {
        const location = this.dropped_items[`${map_id}_${y}_${x}`];

        if (!location) {
            return [];
        }

        if (!toClient) {
            return location;
        }

        return location.map((item) => {
            return {
                id: item.id,
                ...item.getModifiers(),
            };
        });
    }

    /**
     * Adds an item to the ground at the given location.
     * @param  {String}      map_id     Map ID
     * @param  {Number}      x          East
     * @param  {Number}      y          North
     * @param  {Item Object} itemObject The item reference
     * @return {Array}                  List of items at the given location
     */
    drop(map_id, x, y, itemObject) {
        const gridId = `${map_id}_${y}_${x}`;
        this.Game.logger.debug('ItemManager::drop', {map_id, x, y, id: itemObject.id});

        // Generate the item location, should it not exist.
        this.dropped_items[gridId] = this.dropped_items[gridId] || [];

        // stack items if possible
        let itemIndex = -1;

        // remove any database ID's from the item, should there be any (since its not longer owned by a player)
        itemObject._id = null;

        if (itemObject.stats.stackable) {
            itemIndex = this.dropped_items[gridId].findIndex((item) => item.id === itemObject.id);

            if (itemIndex !== -1) {
                this.dropped_items[gridId][itemIndex].addDurability(itemObject.stats.durability);
            }
        } else {
            // reset their dropped status, in case its due to dying the items are dropped.
            itemObject.equipped_slot = null;
        }

        // add item to the dropped items array, if the item was not stacked or if its
        // a non-stackable item
        if (itemIndex === -1) {
            this.dropped_items[gridId].push(itemObject);
        }

        return this.dropped_items[gridId];
    }

    /**
     * Remove an item (or an amount of an item) on the ground, at the specified location
     * @param  {String} map_id   Map ID
     * @param  {Number} x        East
     * @param  {Number} y        North
     * @param  {String} itemName Item to search for
     * @param  {Number} amount   Stackable items only
     * @return {Item Obj}        Item object which was remove.
     */
    pickup(map_id, x, y, itemName, amount) {
        return new Promise((resolve, reject) => {
            // get the list of items at the location
            const locationItems = this.getLocationList(map_id, x, y);
            let foundItemIndex = -1;
            let foundItem;

            if (!locationItems.length) {
                return reject(new Error('No items at the location'));
            }

            // find the item at the location, the user wants to pickup
            if (itemName) {
                itemName = itemName.toLowerCase();

                // check if there is a direct match for the item name
                foundItemIndex = locationItems.findIndex((obj) => obj.name.toLowerCase() === itemName);

                if (foundItemIndex === -1) {
                    // otherwise check if there is an item beginning with the name
                    foundItemIndex = locationItems.findIndex((obj) => obj.name.toLowerCase().indexOf(itemName) !== -1);
                }

                // if still not found, reject
                if (foundItemIndex === -1) {
                    return reject(new Error('Item not found'));
                }

                foundItem = locationItems[foundItemIndex];
            } else {
                foundItemIndex = 0;
                foundItem = locationItems[foundItemIndex];
            }

            // If the item is a non-stackable item, we remove it and return it.
            if (!foundItem.stats.stackable) {
                return resolve(locationItems.splice(foundItemIndex, 1)[0]);
            }

            // if the amount of less or equal to what we need, just return the whole item
            if (foundItem.stats.durability <= amount) {
                return resolve(locationItems.splice(foundItemIndex, 1)[0]);
            }

            // reduce durability of the item on the ground
            foundItem.stats.durability = foundItem.stats.durability - amount;
            // return a new items, with the durability we need
            return resolve(this.add(foundItem.id, {durability: amount}));
        });
    }

    /**
     * Generates and adds the item to the managed get
     * @param {String} itemId     Item ID
     * @param {Object} modifiers  The list of stats overwrites to the template, for the item.
     * @param {String} dbId       Database _id of the item, used for saving the item later.
     */
    add(itemId, modifiers = {}, dbId = null) {
        //this.Game.logger.debug('ItemManager::add', {itemId})
        const template = this.getTemplate(itemId);

        if (!template) {
            return null;
        }

        const itemData = {...template};
        // nested objects are still copied as reference, so we have to make a "sub-copy" of the stats.
        itemData.stats = {...template.stats};

        const NewItem = new Item(this.Game, itemData, modifiers);
        // set the database ID
        NewItem._id = dbId;

        return NewItem;
    }

    /**
     * Removes an item from the game (and db)
     * @param  {Character} character item to remove
     * @param  {Item Obj}  item      item to remove
     * @return {Promise}
     */
    async remove(character, item) {
        const itemClone = {...item};
        item.destroy();

        character.inventory.forEach((obj, index) => {
            if (obj.remove) {
                character.inventory.splice(index, 1);
            }
        });

        // if the item is in the DB, delete it.
        if (itemClone._id) {
            await this.dbLoad(itemClone).then((dbItem) => {
                dbItem.remove();
            })
            .catch((err) => {
                this.Game.logger.error(new Error(err.message));
            });
        }
    }

    /**
     * Get the list of all item templates, to return to the client
     * @return {Object} Plain object of all item templates
     */
    getTemplates() {
        const list = {};

        Object.keys(this.templates).map((itemId) => {
            list[itemId] = this.templates[itemId].toObject();
        });

        return list;
    }

    /**
     * Retrives an item template, from an item id
     * @param  {String} item_id Item ID
     * @return {Object}         Plain object of the item template
     */
    getTemplate(item_id) {
        return this.templates[item_id.toLowerCase()];
    }

    /**
     * Retrives an item template, from an item name
     * @param  {String} itemName Item ID
     * @return {Object}         Plain object of the item template
     */
    getTemplateByName(itemName) {
        itemName = itemName.toLowerCase();

        // first check if there is a direct match between the name and a player
        for (let itemId in this.templates) {
            if (this.templates[itemId].name.toLowerCase() === itemName) {
                return this.templates[itemId];
            }
        }

        // otherwise see if there are any items which begins with the string
        for (let itemId in this.templates) {
            if (this.templates[itemId].name.toLowerCase().indexOf(itemName) === 0) {
                return this.templates[itemId];
            }
        }

        return null;
    }

    /**
     * Load an NPC's inventory
     * @param  {NPN} NPC The NPC object whos inventory to load
     * @return {Promise}
     */
    loadNPCInventory(NPC) {
        return new Promise((resolve, reject) => {
            // If the npc does not have any inventory, just ignore this
            if (!NPC.inventory || !NPC.inventory.length) {
                return resolve([]);
            }

            const inventory = NPC.inventory.map((item) => {
                let newItem = this.add(item.item_id, item.modifiers, null);
                newItem.equipped_slot = item.equipped_slot;

                return newItem;
            });

            resolve(inventory);
        });
    }

    /**
     * Load Character inventory
     * @param  {Character} character The player character
     * @return {Promise}
     */
    loadCharacterInventory(character, callback) {
        ItemModel.find({user_id: character.user_id}, {_id: 1, item_id: 1, modifiers: 1, equipped_slot: 1}, (err, items) => {
            if (err) {
                return callback(err.message);
            }

            const inventory = items.map((item) => {
                let newItem = this.add(item.item_id, item.modifiers, item._id);
                newItem.equipped_slot = item.equipped_slot;

                return newItem;
            });

            callback(null, inventory);
        });
    }

    /**
     * Saves a characters inventory
     * @param  {Character Obj} character Character whos inventory we want to save
     * @return {Promise}
     */
    async saveInventory(character) {
        // if the character has no items, resolve right away
        if (character.inventory.length) {
            await Promise.all(character.inventory.map(async (item) => await this.dbSave(character.user_id, item)));
        }

        try {
            await this.cleanupDbInventory(character);
        } catch (err) {
            this.Game.onError(err);
        }
    }

    /**
     * Delete items no longer owned by a character from the database
     * @param  {Character} character The player to cleanup
     */
    cleanupDbInventory(character) {
        return new Promise((resolve) => {
            const itemDbIds = [];

            character.inventory.forEach((obj) => {
                if (obj._id) {
                    return itemDbIds.push(obj._id.toString());
                }
            });

            ItemModel.deleteMany({user_id: character.user_id, _id: {$nin: itemDbIds}}, (err, deleted) => {
                if (err) {
                    throw new Error(err.message);
                }

                resolve(deleted.deletedCount);
            });
        });
    }

    /**
     * Saves the item in the databse
     * @param  {String} user_id the user id of the owner
     * @param  {Item Object} item the Item object to save
     * @return {Mongoose Object}      The mongoose object of the newly saved item
     */
    dbCreate(user_id, item) {
        return new Promise((resolve, reject) => {
            // create a new item model
            const newItem = new ItemModel({
                user_id,
                item_id: item.id,
                modifiers: item.getModifiers(),
                equipped_slot: item.equipped_slot,
            });

            newItem.save((error) => {
                if (error) {
                    return reject(new Error(error.message));
                }

                item._id = newItem._id;
                resolve(newItem);
            });
        });
    }

    /**
     * Saves an Item Object in the DB, creates a new entry if no existing is found for the item.
     * @param  {String} user_id  User ID of the item owner
     * @param  {Item Object} item
     * @return {[type]}         [description]
     */
    dbSave(user_id, item) {
        return new Promise(async (resolve, reject) => {
            if (!user_id) {
                return reject(new Error('Missing user_id'));
            }

            // retrive item from database if it has a "_id", so we can update it.
            await this.dbLoad(item)
                .then(async (loadedItem) => {
                    if (!loadedItem) {
                        return await this.dbCreate(user_id, item);
                    }

                    loadedItem.modifiers = item.getModifiers();
                    loadedItem.equipped_slot = item.equipped_slot;

                    loadedItem.save((error) => {
                        if (error) {
                            return reject(new Error(error.message));
                        }

                        resolve(loadedItem);
                    });
                });
        });
    }

    /**
     * Loads an item from the DB, by item DB _id.
     * @param  {String} item_db_id The _id mongo has assigned to the item
     * @return {Object}
     */
    dbLoad(item) {
        return new Promise((resolve, reject) => {
            if (!item._id) {
                return resolve(null);
            }

            ItemModel.findOne({_id: item._id.toString()}, (error, item) => {
                if (error) {
                    return reject(new Error(error.message));
                }

                if (!item) {
                    reject(new Error('Item not found'));
                }

                resolve(item);
            });
        });
    }

    /**
     * Updates the prices for items.
     * @return {Promise}
     */
    updatePrices() {
        return new Promise((resolve, reject) => {
            // loop the templates, and set the new prices for any applicable items
            // update the pricing on items, with the priceRange array defined.
            // We update the templates as they will be used for the sell and buy prices
            Object.keys(this.templates).forEach((itemId) => {
                this.templates[itemId].shufflePrice();
            });

            resolve();
        });
    }

    /**
     * Will get the price of the item
     * @param  {String} itemId The item ID to get the price of
     * @return {Promise}
     */
    getItemPrice(itemId) {
        return new Promise((resolve, reject) => {
            const template = this.getTemplate(itemId);

            if (!template) {
                return reject(new Error('Template not found'));
            }

            resolve(template.stats.price);
        });
    }

    /**
     * Generates helper output for an item
     * @param  {Mixed}  item  Command Object or string. if string, it will search for the commands
     * @return {Mixed}        Message array if found, null otherwise.
     */
    getInfo(item) {
        if (typeof item === 'string') {
            item = this.getTemplateByName(item);
            // if the command does not exist
            if (!item) {
                return null;
            }
        }

        const tab = '    ';
        let message = [
            'Item:',
            `${tab}${item.name}`,
            `${tab}${item.description}`,
            'Type:',
            `${tab}${ucfirst(item.type)}${(item.subtype ? ` (${ucfirst(item.subtype)})` : '')}`,
            'Stats:',
            `${tab}Equipable: ${item.stats.equipable ? 'Yes' : 'No'}`,
            `${tab}Stackable: ${item.stats.stackable ? 'Yes' : 'No'}`,
        ];

        switch (item.subtype) {
            case 'ranged':
            case 'melee':
                message.push(`${tab}Damage: ${item.stats.damage_min}-${item.stats.damage_max}`);
                break;

            case 'ammo':
                message.push(`${tab}Damage Bonus: ${item.stats.damage_bonus}`);
                break;

            case 'body':
                message.push(`${tab}Damage Reduction: ${item.stats.damage_reduction}`);
                message.push(`${tab}Durability: ${item.stats.durability} total damage absorbed.`);
                break;

            default:
                message.push(`${tab}Has Use Effect: ${item.stats.useEffect ? 'Yes' : 'No'}`);
                break;
        }

        return message;
    }
}
