import { GAME_ADD_PLAYER, GAME_REMOVE_PLAYER } from './actions';

export function addOnlinePlayer(player) {
    return {
        type: GAME_ADD_PLAYER,
        payload: player
    }
}

export function removeOnlinePlayer(player) {
    return {
        type: GAME_REMOVE_PLAYER,
        payload: player
    }
}