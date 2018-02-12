import {CONNECTION_STATUS, CONNECTION_SOCKET} from './types';

export function setConnectionStatus(connected, connectedEvent) {
    return {
        type: CONNECTION_STATUS,
        payload: {
            connected,
            connectedEvent,
        },
    };
}

export function setSocket(socket) {
    return {
        type: CONNECTION_SOCKET,
        payload: socket,
    };
}

export function dispatchServerAction(action) {
    return action;
}
