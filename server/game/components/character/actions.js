import {JOINED_GRID} from './types';

/**
 * Redux action creator
 * @param  {Character} character The character who is joining the grid
 * @return {Object}              Redux action object
 */
export function joinedGrid(character) {
    return {
        type: JOINED_GRID,
        payload: character,
    };
}
