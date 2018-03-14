import {AUTH_STRATEGIES_SAVE, AUTH_STRATEGIES_GET} from './types';

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
