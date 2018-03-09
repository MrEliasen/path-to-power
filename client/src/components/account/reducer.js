import {ACCOUNT_AUTHENTICATE_SUCCESS, ACCOUNT_LOGOUT} from './types';

const defaultState = {
    authToken: null,
    loggedIn: false,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case ACCOUNT_LOGOUT:
            return defaultState;

        case ACCOUNT_AUTHENTICATE_SUCCESS:
            return {
                authToken: action.payload,
                loggedIn: true,
            };
    }

    return state;
}
