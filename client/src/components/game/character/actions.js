import {MOVE_CHARACTER, CREATE_CHARACTER} from './types';

export function createCharacter(characterData) {
    return {
        type: CREATE_CHARACTER,
        payload: characterData,
    };
}

export function moveCharacter(direction) {
    return {
        type: MOVE_CHARACTER,
        payload: direction,
    };
}
