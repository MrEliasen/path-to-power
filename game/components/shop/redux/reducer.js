import { SERVER_LOAD_SHOP } from './types';

export default function(state = {}, action) {
    let shops;

    switch (action.type) {
        case SERVER_LOAD_SHOP:
            shops = {...state};
            shops[action.payload.id] = action.payload;
            return shops;
    }

    return state;
}