import {MOVE_CHARACTER} from './types';

export function moveCharacter(direction) {
    return {
        type: MOVE_CHARACTER,
        payload: direction,
    };
}
