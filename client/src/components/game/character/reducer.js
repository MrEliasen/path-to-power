import {UPDATE_CHARACTER} from './types';
import {ACCOUNT_LOGOUT} from '../../account/types';
import {REMOTE_LOGOUT} from '../../../shared/types';

export default function(state = null, action) {
    switch (action.type) {
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
