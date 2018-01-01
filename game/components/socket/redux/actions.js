import { CLIENT_NOTIFICATION, SERVER_TO_CLIENT, CLIENT_NEW_EVENT } from './types';

export function createNotification(type, message, title) {
    return {
        type: CLIENT_NOTIFICATION,
        subtype: SERVER_TO_CLIENT,
        payload: {
            type,
            message,
            title
        }
    }
}

export function newEvent(payload) {
    return {
        type: CLIENT_NEW_EVENT,
        subtype: SERVER_TO_CLIENT,
        payload
    }
}