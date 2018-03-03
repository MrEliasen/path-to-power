import {CONNECTION_STATUS, CONNECTION_SOCKET} from './types';
// import {REMOTE_LOGOUT} from '../../../shared/types';

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
    }

    return state;
}
