import { CHARACTER_ADD, CHARACTER_REMOVE } from './types';

const defaultState = {
    online: {},
    list: {}
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
    }

    return state;
}