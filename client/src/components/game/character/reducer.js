import {ACCOUNT_LOGOUT} from '../../account/types';
import {REMOTE_LOGOUT} from '../../../shared/types';
import {
    CHARACTERS_LIST,
    CHARACTER_LOGIN,
    UPDATE_CHARACTER,
    CHARACTER_CREATE_SUCCESS,
} from './types';

const defaultState = {
    selected: null,
    list: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case ACCOUNT_LOGOUT:
        case REMOTE_LOGOUT:
            return defaultState;

        case CHARACTERS_LIST:
            return {
                ...state,
                list: action.payload,
            };

        case CHARACTER_LOGIN:
            return {
                ...state,
                selected: action.payload.character,
            };

        case CHARACTER_CREATE_SUCCESS:
            return {
                ...state,
                list: [
                    ...state.list,
                    action.payload.character,
                ],
            };

        case UPDATE_CHARACTER:
            return {
                ...state,
                selected: {
                    ...state.selected,
                    ...action.payload,
                },
            };
    }

    return state;
}
