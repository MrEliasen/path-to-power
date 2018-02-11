import { JOINED_GRID } from './types';

export function joinedGrid(character) {
    return {
        type: JOINED_GRID,
        payload: character
    }
}