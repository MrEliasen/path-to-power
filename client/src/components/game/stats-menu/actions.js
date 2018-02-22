import {STATS_MENU_TOGGLE} from './types';

export function toggleStatsMenu() {
    return {
        type: STATS_MENU_TOGGLE,
        payload: null,
    };
}
