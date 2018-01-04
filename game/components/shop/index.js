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
}

export default Shop;