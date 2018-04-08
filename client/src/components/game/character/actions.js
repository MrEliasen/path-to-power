import {CHARACTER_MOVE} from 'shared/actionTypes';

export function moveCharacter(direction) {
    return {
        type: CHARACTER_MOVE,
        payload: direction,
    };
}
