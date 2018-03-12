import {
    CONNECTION_STATUS,
    CONNECTION_SOCKET,
    NOTIFICATION_SET,
    NOTIFICATION_CLEAR,
} from './types';

const defaultState = {
    connected: false,
    connectedEvent: false,
    socket: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case CONNECTION_STATUS:
            return {
                ...state,
                ...action.payload,
            };
        case CONNECTION_SOCKET:
            return {
                ...state,
                socket: action.payload,
            };
        case NOTIFICATION_SET:
            return {
                ...state,
                notification: action.payload,
            };
        case NOTIFICATION_CLEAR:
            return {
                ...state,
                notification: null,
            };
    }

    return state;
}
