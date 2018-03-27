import {SHOP_BUY} from 'shared/actionTypes';
import {SHOP_CLOSE} from './types';
import {newCommand} from '../actions';

export function openShop(shopName) {
    return newCommand(`/shop "${shopName}"`);
}

export function shopClose() {
    return {
        type: SHOP_CLOSE,
        payload: null,
    };
}

export function buyItem(itemId, shopFingerprint) {
    return {
        type: SHOP_BUY,
        payload: {
            item: itemId,
            shop: shopFingerprint,
        },
    };
}

/*
import {
    SHOP_SELL,
    SHOP_BUY,
    SHOP_GET_PRICE,
} from 'shared/actionTypes';

export function shopSell(itemFingerprint, shopFingerprint) {
    return {
        type: SHOP_SELL,
        payload: {
            item: itemFingerprint,
            shop: shopFingerprint,
        },
    };
}

export function getItemDetails(itemId, shopFingerprint, priceType) {
    return {
        type: SHOP_GET_PRICE,
        payload: {
            itemId: itemId,
            shop: shopFingerprint,
            priceType: priceType,
        },
    };
}*/
