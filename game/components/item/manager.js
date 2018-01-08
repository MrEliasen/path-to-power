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
        this.items = {};
    }

    /**
     * Load item templates
     * @return {Promise}
     */
    load() {
        return new Promise((resolve, rejecte) => {
            ItemList.map((itemData) => {
                this.templates[itemData.id] = new Item(this.Game, itemData);
            })

            resolve(ItemList.length);
        })
    }

    /**
     * Generates and adds the item to the managed get
     * @param {String} itemId     Item ID
     * @param {Object} modifiers  The list of stats overwrites to the template, for the item.
     */
    add(itemId, modifiers = null) {
        this.Game.logger.info('ItemManager::add', {itemId})

        const itemData = ItemList[itemId];
        const NewItem = new Item(this.Game, itemData, modifiers);

        // add building to the managed buildings array
        this.items.push(NewItem);

        return NewItem;
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

    dbLoad(user_id) {
        return new Promise((resolve, reject) => {
            ItemModel.find({ user_id }, (error, items) => {
                if (error) {
                    return;
                }

                console.log(items);
            })
        })
    }
}