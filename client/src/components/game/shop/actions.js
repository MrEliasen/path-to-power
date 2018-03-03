import {SHOP_SELL, SHOP_BUY, SHOP_GET_PRICE} from '../../../shared/types';
import {SHOP_CLOSE} from './types';

export function shopBuy(itemId, index, shopFingerprint) {
    return {
        type: SHOP_BUY,
        payload: {
            item: itemId,
            shop: shopFingerprint,
            index: index,
        },
    };
}

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
}

export function shopClose() {
    return {
        type: SHOP_CLOSE,
        payload: null,
    };
}
