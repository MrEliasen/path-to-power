import {INVENTORY_MENU_TOGGLE, EQUIP_ITEM, UNEQUIP_ITEM} from './types';

export function toggleInventoryMenu() {
    return {
        type: INVENTORY_MENU_TOGGLE,
        payload: null,
    };
}

export function equipItem(index) {
    return {
        type: EQUIP_ITEM,
        payload: index,
    };
}

export function unequipItem(slot) {
    return {
        type: UNEQUIP_ITEM,
        payload: slot,
    };
}
