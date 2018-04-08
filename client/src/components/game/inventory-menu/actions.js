import {
    CHARACTER_EQUIP_ITEM,
    CHARACTER_UNEQUIP_ITEM,
} from 'shared/actionTypes';

import {INVENTORY_MENU_TOGGLE} from './types';

export function toggleInventoryMenu() {
    return {
        type: INVENTORY_MENU_TOGGLE,
        payload: null,
    };
}

export function equipItem(index) {
    return {
        type: CHARACTER_EQUIP_ITEM,
        payload: index,
    };
}

export function unequipItem(slot) {
    return {
        type: CHARACTER_UNEQUIP_ITEM,
        payload: slot,
    };
}
