import {
    USER_AUTHENTICATE,
    USER_LOGOUT,
} from 'shared/actionTypes';

import {
    AUTH_STRATEGIES_SAVE,
    AUTH_STRATEGIES_GET,
    AUTH_PASSWORD_RESET,
    AUTH_LINK,
    AUTH_UNLINK,
    AUTH_SAVE,
    AUTH_SIGNUP,
    AUTH_PROVIDER,
} from './types';

export function saveStrategies(strategies) {
    return {
        type: AUTH_STRATEGIES_SAVE,
        payload: strategies,
    };
}

export function getStrategies() {
    return {
        type: AUTH_STRATEGIES_GET,
        payload: null,
    };
}

export function resetPassword(email) {
    return {
        type: AUTH_PASSWORD_RESET,
        payload: email,
    };
}

export function linkProvider(authToken, providerToken) {
    return {
        type: AUTH_LINK,
        payload: {
            authToken,
            providerToken,
        },
    };
}

export function unlinkProvider(userId, authToken, provider) {
    return {
        type: AUTH_UNLINK,
        payload: {
            userId,
            authToken,
            provider,
        },
    };
}

export function authLogout() {
    return {
        type: USER_LOGOUT,
        payload: {},
    };
}

export function authLogin(jwt) {
    return {
        type: AUTH_SAVE,
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

export function authProvider(providerToken) {
    return {
        type: AUTH_PROVIDER,
        payload: {
            providerToken,
        },
    };
}

export function userSignUp(email, password, passwordConfirm) {
    return {
        type: AUTH_SIGNUP,
        payload: {
            email,
            password,
            passwordConfirm,
        },
    };
}
