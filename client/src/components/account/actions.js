import {
    USER_AUTHENTICATE,
    USER_LOGOUT,
} from 'shared/actionTypes';

import {
    ACCOUNT_AUTHENTICATE_SAVE,
    USER_SIGNUP,
    USER_DETAILS,
    USER_DETAILS_GET,
    USER_DETAILS_UPDATE,
    USER_AUTHENTICATE_PROVIDER,
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

export function userSignUp(email, password, passwordConfirm) {
    return {
        type: USER_SIGNUP,
        payload: {
            email,
            password,
            passwordConfirm,
        },
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

export function authProvider(providerToken) {
    return {
        type: USER_AUTHENTICATE_PROVIDER,
        payload: {
            providerToken,
        },
    };
}

export function getUserDetails(userId, authToken) {
    return {
        type: USER_DETAILS_GET,
        payload: {
            userId,
            authToken,
        },
    };
}

export function saveUserDetails(userDetails) {
    return {
        type: USER_DETAILS,
        payload: userDetails,
    };
}

export function updateAccount(userId, authToken, details) {
    return {
        type: USER_DETAILS_UPDATE,
        payload: {
            authToken,
            userId,
            details,
        },
    };
}
