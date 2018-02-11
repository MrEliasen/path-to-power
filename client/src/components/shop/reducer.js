import {SHOP_LOAD, SHOP_CLOSE, SHOP_EVENT, SHOP_UPDATE} from './types';

export default function(state = null, action) {
    switch (action.type) {
        case SHOP_LOAD:
            return {
                ...action.payload,
                notification: null,
                open: true,
            };
        case SHOP_CLOSE:
            return {
                ...state,
                open: false,
            };
        case SHOP_EVENT:
            // bootstrap converter
            if (action.payload.type === 'error') {
                action.payload.type = 'danger';
            }

            return {
                ...state,
                notification: action.payload,
            };
        case SHOP_UPDATE:
            const shop = {...state};

            // if the client is view a different shop, ignore the update.
            if (shop.id !== action.payload.shopId) {
                return state;
            }

            shop.sell.list = action.payload.inventory;
            return {
                ...state,
                ...shop,
            };
    }

    return state;
}
