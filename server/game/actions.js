import { NEW_EVENT, NEWS_UPDATE } from './types';

export function newEvent(type, message, ignore =[]) {
    return {
        type: NEW_EVENT,
        payload: {
            type,
            message,
            ignore
        }
    }
}

export function addNews(message) {
    return {
        type: NEWS_UPDATE,
        payload: message
    }
}