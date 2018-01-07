// manager specific imports
import ItemList from '../../data/items.json';
import Item from './object';

export default class ItemManager {
    constructor(Game) {
        this.Game = Game;
        // list of items managed by the item manager
        this.items = [];
    }

    add(itemId) {
        this.Game.logger.info('ItemManager::add', {itemId})

        const itemData = ItemList[itemId];
        const NewItem = new Item(this.Game, itemData);

        // add building to the managed buildings array
        this.items.push(NewItem);

        return NewItem;
    }
}