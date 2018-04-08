import {
    CHARACTER_UPDATE,
    CHARACTERS_LIST,
    CHARACTER_LOGIN,
    CHARACTER_CREATE_SUCCESS,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
} from 'shared/actionTypes';

const defaultState = {
    selected: null,
    list: null,
};

export default function(state = defaultState, action) {
    switch (action.type) {
        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
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

        case CHARACTER_UPDATE:
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
