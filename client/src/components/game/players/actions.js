import {PLAYERS_MENU_TOGGLE} from './types';

export function togglePlayersMenu() {
    return {
        type: PLAYERS_MENU_TOGGLE,
        payload: null,
    };
}
