import { CHARACTER_ADD, CHARACTER_REMOVE, CLIENT_MOVE_CHARACTER } from './types';
import { CLIENT_LEAVE_GRID, CLIENT_JOIN_GRID } from '../../map/redux/types';

const defaultState = {
    online: {},
    list: {},
    locations: {}
}

export default function (state = defaultState, action) {
    let characters;
    let locations;

    switch (action.type) {
        case CHARACTER_ADD:
            characters = {...state};
            characters.online[action.payload.user_id] = action.payload.name;
            characters.list[action.payload.user_id] = action.payload;
            return characters;

        case CHARACTER_REMOVE:
            characters = {...state};
            delete characters.online[action.payload.user_id];
            delete characters.list[action.payload.user_id];
            return characters;

        case CLIENT_JOIN_GRID:
            locations = {...state.locations};

            if (!locations[action.payload.location.map]) {
                locations[action.payload.location.map] = {};
            }
            if (!locations[action.payload.location.map][action.payload.location.y]) {
                locations[action.payload.location.map][action.payload.location.y] = {};
            }
            if (!locations[action.payload.location.map][action.payload.location.y][action.payload.location.x]) {
                locations[action.payload.location.map][action.payload.location.y][action.payload.location.x] = {};
            }

            locations[action.payload.location.map][action.payload.location.y][action.payload.location.x][action.payload.user_id] = action.payload.name;
            return {
                ...state,
                locations
            }

        case CLIENT_LEAVE_GRID:
            locations = {...state.locations};

            if (locations[action.payload.location.map]) {
                if (locations[action.payload.location.map][action.payload.location.y]) {
                    if (locations[action.payload.location.map][action.payload.location.y][action.payload.location.x]) {
                        delete locations[action.payload.location.map][action.payload.location.y][action.payload.location.x][action.payload.user_id];
                    }
                }
            }

            return {
                ...state,
                locations
            }
    }

    return state;
}