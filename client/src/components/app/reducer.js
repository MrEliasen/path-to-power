import {ACCOUNT_LOGOUT} from '../auth/types';
import {NOTIFICATION_CLEAR, CLIENT_NOTIFICATION} from './types';

const defaultState = {
    notification: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case NOTIFICATION_CLEAR:
            return {
                ...state,
                notification: null,
            };

        case CLIENT_NOTIFICATION:
            return {
                ...state,
                notification: {
                    message: action.payload.message,
                    class: `alert-${(
                        action.payload.type === 'error' ?
                        'danger' : action.payload.type
                    )}`,
                },
            };

        case ACCOUNT_LOGOUT:
            return defaultState;
    }

    return state;
}
