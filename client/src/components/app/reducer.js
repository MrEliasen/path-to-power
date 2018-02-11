import {CONNECTION_STATUS, CONNECTION_SOCKET} from './types';

const defaultState = {
    connected: false,
    socket: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case CONNECTION_STATUS:
            return {
                ...state,
                connected: action.payload,
            };
        case CONNECTION_SOCKET:
            return {
                ...state,
                socket: action.payload,
            };
    }

    return state;
}
