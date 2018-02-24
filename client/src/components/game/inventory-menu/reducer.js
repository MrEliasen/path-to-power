import {INVENTORY_MENU_TOGGLE} from './types';
import {PLAYERS_MENU_TOGGLE} from '../players-menu/types';
import {STATS_MENU_TOGGLE} from './types';
import {REMOTE_LOGOUT} from '../../../../../server/shared/types';

const defaultState = {
    open: false,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case INVENTORY_MENU_TOGGLE:
            return {
                open: !state.open,
            };

        case PLAYERS_MENU_TOGGLE:
        case STATS_MENU_TOGGLE:
            return {
                open: false,
            };
        case REMOTE_LOGOUT:
            return defaultState;
    }

    return state;
}
