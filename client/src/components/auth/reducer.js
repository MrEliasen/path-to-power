import {ACCOUNT_AUTHENTICATE_ERROR, ACCOUNT_LOGOUT} from './types';

export default function(state = null, action) {
    switch (action.type) {
        case ACCOUNT_LOGOUT:
            return null;

        case ACCOUNT_AUTHENTICATE_ERROR:
            return {...action.payload};
    }

    return state;
}
