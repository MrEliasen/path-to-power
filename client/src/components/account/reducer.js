import {CHARACTERS_LIST} from './types';

export default function(state = {}, action) {
    switch (action.type) {
        case CHARACTERS_LIST:
            return action.payload;
    }

    return state;
}
