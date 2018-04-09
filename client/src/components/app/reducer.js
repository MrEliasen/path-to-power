import {
    CONNECTION_STATUS,
    CONNECTION_SOCKET,
    NOTIFICATION_CLEAR,
    LOADING_SET,
    LOADING_CLEAR,
} from './types';
import {
    USER_LOGOUT,
    NOTIFICATION_SET,
} from 'shared/actionTypes';

const defaultState = {
    connected: false,
    connectedEvent: false,
    socket: null,
    loading: null,
    notification: null,
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
                loading: null,
            };
        case NOTIFICATION_CLEAR:
            return {
                ...state,
                notification: null,
            };
        case LOADING_SET:
            return {
                ...state,
                loading: action.payload,
            };
        case USER_LOGOUT:
        case LOADING_CLEAR:
            return {
                ...state,
                loading: null,
            };
    }

    return state;
}
