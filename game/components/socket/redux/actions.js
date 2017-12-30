import { CLIENT_NOTIFICATION } from './types';

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