import {SHOP_LOAD, SHOP_EVENT, SHOP_UPDATE, SHOP_ITEM_PRICE} from '../../../../server/shared/types';
import {SHOP_CLOSE} from './types';

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

        case SHOP_ITEM_PRICE:
            return {
                ...state,
                details: action.payload,
            };
    }

    return state;
}
