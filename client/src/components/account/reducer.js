import {CHARACTERS_LIST, ACCOUNT_AUTHENTICATE, ACCOUNT_LOGOUT, ACCOUNT_AUTHENTICATE_SUCCESS} from './types';

const defaultState = {
    authToken: null,
    loggedIn: false,
    characters: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case ACCOUNT_LOGOUT:
            return defaultState;

        case CHARACTERS_LIST:
            return {
                ...state,
                characters: action.payload,
            };

        case ACCOUNT_AUTHENTICATE:
            return {
                ...state,
                authToken: action.payload,
            };

        case ACCOUNT_AUTHENTICATE_SUCCESS:
            return {
                ...state,
                loggedIn: true,
            };
    }

    return state;
}
