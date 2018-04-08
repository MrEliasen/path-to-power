import {
    CONNECTION_STATUS,
    SOCKET_CONNECT,
    SOCKET_SEND,
    LOADING_SET,
    LOADING_CLEAR,
} from './types';

export function setConnectionStatus(connected, connectedEvent) {
    return {
        type: CONNECTION_STATUS,
        payload: {
            connected,
            connectedEvent,
        },
    };
}

export function socketConnect() {
    return {
        type: SOCKET_CONNECT,
        payload: null,
    };
}

export function socketSend(action) {
    return {
        type: SOCKET_SEND,
        payload: action,
    };
}

export function setLoading(loadingMessage) {
    return {
        type: LOADING_SET,
        payload: {
            message: loadingMessage,
        },
    };
}

export function clearLoading() {
    return {
        type: LOADING_CLEAR,
        payload: null,
    };
}
