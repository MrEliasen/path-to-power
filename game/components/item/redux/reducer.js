import { SERVER_LOAD_ITEM } from './types';

export default function(state = {}, action) {
    let items;

    switch (action.type) {
        case SERVER_LOAD_ITEM:
            items = {...state};
            items[action.payload.id] = action.payload;
            return items;
    }

    return state;
}