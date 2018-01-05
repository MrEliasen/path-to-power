class Shop {
    constructor(data) {
        this.loaded = new Promise((resolve, rejecte) => {
            Object.assign(this, data);

            this.loadShop(() => {
                resolve(this);
            });
        });
    }

    loadShop(callback) {
        callback()
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

export default Shop;