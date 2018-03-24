import {
    CHARACTER_EQUIP_ITEM,
    CHARACTER_UNEQUIP_ITEM,
    CHARACTER_MOVE_ITEM,
} from 'shared/actionTypes';

import {socketSend} from '../../app/actions';

export function equipItem(inventorySlot, targetSlot) {
    return socketSend({
        type: CHARACTER_EQUIP_ITEM,
        payload: {
            inventorySlot,
            targetSlot,
        },
    });
}

export function unequipItem(inventorySlot, targetSlot) {
    return socketSend({
        type: CHARACTER_UNEQUIP_ITEM,
        payload: {
            inventorySlot,
            targetSlot,
        },
    });
}

export function moveItem(inventorySlot, targetSlot) {
    return socketSend({
        type: CHARACTER_MOVE_ITEM,
        payload: {
            inventorySlot,
            targetSlot,
        },
    });
}
