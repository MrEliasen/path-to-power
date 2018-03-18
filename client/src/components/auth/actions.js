import {
    AUTH_STRATEGIES_SAVE,
    AUTH_STRATEGIES_GET,
    AUTH_PASSWORD_RESET,
    AUTH_LINK,
    AUTH_UNLINK,
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
