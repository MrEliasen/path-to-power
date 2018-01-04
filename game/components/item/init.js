import items from '../../data/items.json';
import Item from './index';
import { SERVER_LOAD_ITEM } from './redux/types';

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
        let loadeditems = 0;

        items.map((item) => {
            createItem(item).then((loadedItem) => {
                loadeditems++;

                dispatch({
                    type: SERVER_LOAD_ITEM,
                    payload: loadedItem
                })

                if (loadeditems === items.length) {
                    resolve();
                }
            })
        })
    })
}