import {PLAYERS_MENU_TOGGLE} from './types';
import {INVENTORY_MENU_TOGGLE} from '../inventory-menu/types';
import {STATS_MENU_TOGGLE} from './types';
import {REMOTE_LOGOUT} from '../../../shared/types';

const defaultState = {
    open: false,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case PLAYERS_MENU_TOGGLE:
            return {
                open: !state.open,
            };

        case INVENTORY_MENU_TOGGLE:
        case STATS_MENU_TOGGLE:
            return {
                open: false,
            };
        case REMOTE_LOGOUT:
            return defaultState;
    }

    return state;
}
