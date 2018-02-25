import {UPDATE_CHARACTER} from './types';
import {ACCOUNT_LOGOUT, ACCOUNT_AUTHENTICATE_SUCCESS} from '../../auth/types';
import {REMOTE_LOGOUT} from '../../../shared/types';

export default function(state = null, action) {
    switch (action.type) {
        case ACCOUNT_AUTHENTICATE_SUCCESS:
            return action.payload.character;

        case UPDATE_CHARACTER:
            return {
                ...state,
                ...action.payload,
            };

        case ACCOUNT_LOGOUT:
            return null;

        case REMOTE_LOGOUT:
            return null;
    }

    return state;
}
