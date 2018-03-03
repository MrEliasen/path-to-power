import {ACCOUNT_AUTHENTICATE, ACCOUNT_LOGOUT} from './types';

export default function(state = null, action) {
    switch (action.type) {
        case ACCOUNT_LOGOUT:
            return null;
        case ACCOUNT_AUTHENTICATE:
            return {
                authToken: action.payload,
            };
    }

    return state;
}
