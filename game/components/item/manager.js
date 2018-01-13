// manager specific imports
import ItemModel from './model';
import ItemList from '../../data/items.json';
import Item from './object';

export default class ItemManager {
    constructor(Game) {
        this.Game = Game;
        // list of all items in the game, for reference
        this.templates = {};
        // list of items managed by the item manager
        this.items = [];
        // dropped items, references items from the items list
        this.dropped_items = {};
    }

    /**
     * Load item templates
     * @return {Promise}
     */
    load() {
        return new Promise((resolve, rejecte) => {
            ItemList.map((itemData) => {
                this.templates[itemData.id] = new Item(this.getTemplate(itemData.id), itemData);
            })

            resolve(ItemList.length);
        })
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
        if (!this.dropped_items[map_id]) {
            return [];
        }
        if (!this.dropped_items[map_id][y]) {
            return [];
        }
        if (!this.dropped_items[map_id][y][x]) {
            return [];
        }

        if (!toClient) {
            return this.dropped_items[map_id][y][x];
        }

        return this.dropped_items[map_id][y][x].map((item) => {
            return {
                id: item.id,
                ...item.getModifiers()
            }
        });
    }

    /**
     * Adds an item to the ground at the given location.
     * @param  {String} map_id     Map ID
     * @param  {Number} x          East
     * @param  {Number} y          North
     * @param  {Item Object} itemObject The item reference
     * @return {Array}            List of items at the given location
     */
    drop(map_id, x, y, itemObject) {
        this.Game.logger.debug('ItemManager::drop', {map_id, x, y, itemObject});

        // Generate the item location, should it not exist.
        this.dropped_items[map_id] = this.dropped_items[map_id] || {};
        this.dropped_items[map_id][y] = this.dropped_items[map_id][y] || {};
        this.dropped_items[map_id][y][x] = this.dropped_items[map_id][y][x] || [];

        // add item to the dropped items array
        this.dropped_items[map_id][y][x].push(itemObject);

        return this.dropped_items[map_id][y][x];
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
            // find the item at the location, the user wants to pickup
            const foundItemIndex = locationItems.findIndex((obj) => obj.name.toLowerCase().indexOf(itemName) !== -1);

            // if not found, let them know
            if (foundItemIndex === -1) {
                return reject(); //Game.eventToSocket(socket, 'error', 'There are no items on the ground, matching that name.')
            }

            const foundItem = locationItems[foundItemIndex];

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
    add(itemId, modifiers = null, dbId = null) {
        this.Game.logger.info('ItemManager::add', {itemId})

        const itemData = this.getTemplate(itemId);
        const NewItem = new Item(this.getTemplate(itemData.id), itemData, modifiers);
        // set the database ID
        NewItem._id = dbId;

        // add building to the managed buildings array
        this.items.push(NewItem);

        return NewItem;
    }

    /**
     * Removes an item from the game (and db)
     * @param  {Item Obj} item item to remove
     * @return {Promise}
     */
    remove(item) {
        const itemDbId = item._id;
        item.destroy();

        const newItemList = this.items.filter((managedItem) => !managedItem.remove);
        this.items = newItemList;

        // if the item is in the DB, delete it.
        if (itemDbId) {
            this.dbLoad(itemDbId).then((dbItem) => {
                dbItem.remove();
            })
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
        })

        return list;
    }

    /**
     * Retrives an item template, from an item id
     * @param  {String} item_id Item ID
     * @return {Object}         Plain object of the item template
     */
    getTemplate(item_id) {
        return this.templates[item_id];
    }

    loadInventory(character) {
        return new Promise((resolve, reject) => {
            ItemModel.find({ user_id: character.user_id}, {_id: 1, item_id: 1, modifiers: 1}, (err, items) => {
                if (err) {
                    this.Game.logger.error(`Error loading inventory for user: ${user_id}`, err);
                    return reject(err);
                }

                const inventory = [];
                items.map((item) => {
                    inventory.push(this.add(item.item_id, item.modifiers, item._id))
                })

                resolve(inventory);
            })
        })
    }

    /**
     * Saves a characters inventory
     * @param  {Character Obj} character Character whos inventory we want to save
     * @return {Promise}
     */
    saveInventory(character) {
        return new Promise((resolve, reject) => {
            const numOfItems = character.inventory.length;
            let succeeded = 0;
            let failed = 0;

            // if the character has no items, resolve right away
            if (!numOfItems) {
                return resolve();
            }

            character.inventory.map((item) => {
                this.dbSave(character.user_id, item)
                    .then((itemDbObject) => {
                        succeeded++;

                        if ((succeeded + failed) === numOfItems) {
                            resolve(failed, succeeded);
                        }
                    })
                    .catch((error) => {
                        failed++;
                        this.Game.logger.error('Error saving inventory item:', error);

                        if ((succeeded + failed) === numOfItems) {
                                resolve(failed, succeeded);
                            }
                    })
            })
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
                equipped_slot: item.equipped_slot
            })

            newItem.save((error) => {
                if (error) {
                    return reject(error);
                }

                item._id = newItem._id;
                resolve(newItem);
            })
        })
    }

    /**
     * Saves an Item Object in the DB, creates a new entry if no existing is found for the item.
     * @param  {String} user_id  User ID of the item owner
     * @param  {Item Object} item    
     * @return {[type]}         [description]
     */
    dbSave(user_id, item) {
        return new Promise((resolve, reject) => {
            if (!user_id) {
                return reject('Missing user_id');
            }

            // retrive item from database if it has a "_id", so we can update it.
            this.dbLoad(item)
                .then((loadedItem) => {
                    if (!loadedItem) {
                        return this.dbCreate(user_id, item);
                    }

                    loadedItem.modifiers - item.getModifiers();
                    loadedItem.equipped_slot - item.equipped_slot;

                    loadedItem.save((error) => {
                        if (error) {
                            return reject(error);
                        }

                        resolve(loadedItem);
                    })
                })
        })
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

            ItemModel.findOne({ _id: item._id }, (error, item) => {
                if (error) {
                    return reject(error);
                }

                resolve(item);
            })
        })
    }
}