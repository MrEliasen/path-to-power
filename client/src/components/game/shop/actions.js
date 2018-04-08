import {SHOP_BUY, SHOP_SELL} from 'shared/actionTypes';
import {SHOP_CLOSE} from './types';
import {newCommand} from '../actions';
import {socketSend} from '../../app/actions';

export function openShop(shopName) {
    return newCommand(`/shop "${shopName}"`);
}

export function shopClose() {
    return {
        type: SHOP_CLOSE,
        payload: null,
    };
}

export function buyItem(itemFingerprint, shopFingerprint, targetSlot) {
    return socketSend({
        type: SHOP_BUY,
        payload: {
            item: itemFingerprint,
            shop: shopFingerprint,
            targetSlot,
        },
    });
}

export function shopSell(inventorySlot, shopFingerprint) {
    return socketSend({
        type: SHOP_SELL,
        payload: {
            item: inventorySlot,
            shop: shopFingerprint,
        },
    });
}

/*
import {
    SHOP_GET_PRICE,
} from 'shared/actionTypes';

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
