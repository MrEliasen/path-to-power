export default class Shop {
    constructor(Game, shopData) {
        this.Game = Game;
        Object.assign(this, shopData);
    }

    toObject() {
        return {
            id: this.id,
            name: this.name,
            sell: {
                ...this.sell,
                list: [
                    ...this.sell.list
                ]
            },
            buy: {
                ...this.buy,
                list: [
                    ...this.buy.list
                ]
            }
        }
    }

    addToInventory(itemModifiers, amount, itemObj) {
        let addedItem = {
            ...itemModifiers,
            quantity: amount
        };

        // if the item is stackable, push it (incl modifiers) to the shop.
        if (itemObj.stats.stackable) {
            const listItem = this.sell.list.find((item) => item.id === itemObj.id);

            // if we find a matching item, increase the quantity.
            if (listItem) {
                listItem.quantity = listItem.quantity + amount;
                return {...listItem};
            }

            // remove durability from stackable items
            delete addedItem.durability;
        }

        this.sell.list.push(addedItem);
        return addedItem;
    }
}