import { NEW_EVENT } from './types';

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