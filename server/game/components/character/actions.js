import {CHARACTER_JOINED_GRID} from 'shared/actionTypes';

/**
 * Redux action creator
 * @param  {Character} character The character who is joining the grid
 * @return {Object}              Redux action object
 */
export function joinedGrid(character) {
    return {
        type: CHARACTER_JOINED_GRID,
        payload: character,
    };
}
