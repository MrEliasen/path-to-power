import {
    ACCOUNT_LOGOUT,
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_SAVE,
} from './types';

export function authLogout() {
    return {
        type: ACCOUNT_LOGOUT,
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
        type: ACCOUNT_AUTHENTICATE,
        payload: {
            email,
            password,
        },
    };
}
