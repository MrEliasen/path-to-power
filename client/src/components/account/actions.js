import {
    USER_AUTHENTICATE,
    USER_LOGOUT,
} from 'shared/actionTypes';

import {
    ACCOUNT_AUTHENTICATE_SAVE,
} from './types';

export function authLogout() {
    return {
        type: USER_LOGOUT,
        payload: {},
    };
}

export function authLogin(jwt) {
    return {
        type: ACCOUNT_AUTHENTICATE_SAVE,
        payload: jwt,
    };
}

export function authLocal(email, password) {
    return {
        type: USER_AUTHENTICATE,
        payload: {
            email,
            password,
        },
    };
}
