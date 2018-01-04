import { CLIENT_NOTIFICATION, SERVER_TO_CLIENT, CLIENT_NEW_EVENT } from './types';
/**
 * action for sending notifications to the client
 * @param  {String} type    Notification type (error|warning|info|success)
 * @param  {String} message Notification message
 * @param  {String} title   Notification title
 * @return {Object}
 */
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

/**
 * action for displaying client events
 * @param  {Object} payload action payload (type, message)
 * @return {Object}
 */
export function newEvent(payload) {
    return {
        type: CLIENT_NEW_EVENT,
        subtype: SERVER_TO_CLIENT,
        payload
    }
}