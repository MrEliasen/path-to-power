import {NEW_EVENT, NEWS_UPDATE} from './types';

/**
 * New event action creator
 * @param  {String} type    Event type
 * @param  {Mixed}  message Event message content
 * @param  {Array}  ignore  List of player IDs who should ignore this meesage
 * @return {Object}         Reduct action
 */
export function newEvent(type, message, ignore =[]) {
    return {
        type: NEW_EVENT,
        payload: {
            type,
            message,
            ignore,
        },
    };
}

/**
 * News action creator
 * @param {String} message The new message
 */
export function addNews(message) {
    return {
        type: NEWS_UPDATE,
        payload: message,
    };
}
