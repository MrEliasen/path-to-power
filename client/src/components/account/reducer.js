import jwt from 'jsonwebtoken';
import {
    USER_AUTHENTICATE_SUCCESS,
    USER_LOGOUT,
} from 'shared/actionTypes';
import {USER_DETAILS} from './types';

const defaultState = {
    authToken: null,
    loggedIn: false,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case USER_LOGOUT:
            return defaultState;

        case USER_DETAILS:
            return {
                ...state,
                user: {
                    ...state.user,
                    ...action.payload,
                },
            };

        case USER_AUTHENTICATE_SUCCESS:
            const decoded = jwt.decode(action.payload.authToken);

            return {
                authToken: action.payload.authToken,
                loggedIn: true,
                user: {
                    identities: [],
                    ...decoded,
                },
            };
    }

    return state;
}
