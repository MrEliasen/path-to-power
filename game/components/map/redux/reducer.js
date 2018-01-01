import { SERVER_LOAD_MAP } from './types';

export default function(state = {}, action) {
    let maps;

    switch (action.type) {
        case SERVER_LOAD_MAP:
            maps = {...state};
            maps[action.payload.id] = action.payload;
            return maps;
    }

    return state;
}