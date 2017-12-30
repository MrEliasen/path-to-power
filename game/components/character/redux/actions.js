import { CHARACTER_ADD, CHARACTER_REMOVE } from './types';

export function addOnlineCharacter(character) {
    return {
        type: CHARACTER_ADD,
        payload: character
    }
}

export function removeOnlineCharacter(character) {
    return {
        type: CHARACTER_REMOVE,
        payload: character
    }
}