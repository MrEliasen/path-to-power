import {INVENTORY_MENU_TOGGLE} from './types';
import {PLAYERS_MENU_TOGGLE} from '../players/types';
import {STATS_MENU_TOGGLE} from './types';
import {CHARACTER_REMOTE_LOGOUT} from 'shared/actionTypes';

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
        case CHARACTER_REMOTE_LOGOUT:
            return defaultState;
    }

    return state;
}
