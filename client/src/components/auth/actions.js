import {
    ACCOUNT_LOGOUT,
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_ERROR,
} from './types';

export function authLogout() {
    return {
        type: ACCOUNT_LOGOUT,
        payload: {},
    };
}

export function authLogin(data) {
    return {
        type: ACCOUNT_AUTHENTICATE,
        payload: data,
    };
}

export function newAuthError(notification) {
    return {
        type: ACCOUNT_AUTHENTICATE_ERROR,
        payload: notification,
    };
}
