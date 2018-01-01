import { CHARACTER_ADD, CHARACTER_REMOVE, CLIENT_MOVE_CHARACTER } from './types';

const defaultState = {
    online: {},
    list: {},
    locations: {}
}

export default function (state = defaultState, action) {
    let characters;

    switch (action.type) {
        case CHARACTER_ADD:
            characters = {...state};
            characters.online[action.payload.user_id] = action.payload.name;
            characters.list[action.payload.user_id] = action.payload;
            return characters

        case CHARACTER_REMOVE:
            characters = {...state};
            delete characters.online[action.payload.user_id];
            delete characters.list[action.payload.user_id];
            return characters

        case CLIENT_MOVE_CHARACTER:
            const locations = {...state.locations};
            locations[action.payload.new.map][action.payload.new.y][action.payload.new.x] = action.payload.name;
            delete locations[action.payload.old.map][action.payload.old.y][action.payload.old.x][action.payload.user_id];
            return {
                ...state,
                locations
            }
    }

    return state;
}