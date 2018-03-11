import {
    USER_AUTHENTICATE_SUCCESS,
    USER_LOGOUT,
} from 'shared/actionTypes';

const defaultState = {
    authToken: null,
    loggedIn: false,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case USER_LOGOUT:
            return defaultState;

        case USER_AUTHENTICATE_SUCCESS:
            return {
                authToken: action.payload,
                loggedIn: true,
            };
    }

    return state;
}
