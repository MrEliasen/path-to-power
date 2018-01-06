import { CLIENT_DROP_ITEM, CLIENT_PICKUP_ITEM, SERVER_DROP_ITEM, SERVER_PICKUP_ITEM, CLIENT_DROP_MULTIPLE_ITEMS } from './types';
import { SERVER_TO_CLIENT } from '../../socket/redux/types';

export function dropItem(item) {
    return {
        type: CLIENT_DROP_ITEM,
        subtype: SERVER_TO_CLIENT,
        payload: item
    }
}

export function pickupItem(item) {
    return {
        type: CLIENT_PICKUP_ITEM,
        subtype: SERVER_TO_CLIENT,
        payload: item
    }
}

export function serverRecordItemDrop(iteminfo) {
    return {
        type: SERVER_DROP_ITEM,
        payload: iteminfo
    }
}

export function serverRecordItemPickup(iteminfo) {
    return {
        type: SERVER_PICKUP_ITEM,
        payload: iteminfo
    }
}

export function dropMultipleItems(itemArray) {
    return {
        type: CLIENT_DROP_MULTIPLE_ITEMS,
        subtype: SERVER_TO_CLIENT,
        payload: itemArray
    }
}

