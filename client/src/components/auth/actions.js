import {
    ACCOUNT_LOGOUT,
    ACCOUNT_AUTHENTICATE,
} from './types';

export function authLogout() {
    return {
        type: ACCOUNT_LOGOUT,
        payload: {},
    };
}

export function authLogin(jwt) {
    return {
        type: ACCOUNT_AUTHENTICATE,
        payload: jwt,
    };
}
