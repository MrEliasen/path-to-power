import {
    CHARACTER_REMOTE_LOGOUT,
    SHOP_LOAD,
    SHOP_UPDATE,
    SHOP_ITEM_PRICE,
    CHARACTER_LOGOUT,
    SHOP_EVENT,
} from 'shared/actionTypes';
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

        case SHOP_EVENT:
            return {
                ...state,
                notification: action.payload,
            };

        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
            return null;
    }

    return state;
}
