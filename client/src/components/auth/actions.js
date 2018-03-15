import {AUTH_STRATEGIES_SAVE, AUTH_STRATEGIES_GET, AUTH_PASSWORD_RESET} from './types';

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
