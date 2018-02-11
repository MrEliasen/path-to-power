import {NOTIFICATION_CLEAR, NOTIFICATION_SET} from './types';

export function clearNotification() {
    return {
        type: NOTIFICATION_CLEAR,
        payload: {},
    };
}

export function setNotification(payload) {
    return {
        type: NOTIFICATION_SET,
        payload: payload,
    };
}
