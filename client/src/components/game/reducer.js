import {
    CHARACTER_ONLINE_ADD,
    CHARACTER_ONLINE_REMOVE,
    CHARACTER_LOGIN,
    COMMAND_CHAT_MESSAGE,
    MAP_LIST,
    USER_AUTHENTICATE_SUCCESS,
    GAME_NEWS,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
} from 'shared/actionTypes';

import {getRandomColour} from '../../helper';

const defaultState = {
    players: [],
    news: null,
    maps: {},
    chat: [],
    items: {},
    commands: {},
    levels: [],
};
export default function(state = defaultState, action) {
    let players;

    switch (action.type) {
        case GAME_NEWS:
            return {
                ...state,
                news: {
                    message: action.payload,
                    colour: getRandomColour(),
                },
            };

        case MAP_LIST:
            return {
                ...state,
                maps: action.payload,
            };

        case CHARACTER_LOGIN:
        case USER_AUTHENTICATE_SUCCESS:
            return {
                ...state,
                ...action.payload.gameData,
            };

        case CHARACTER_ONLINE_ADD:
            players = state.players.filter((user) => user.user_id !== action.payload.user_id);
            players.push(action.payload);

            return {
                ...state,
                players,
            };

        case CHARACTER_ONLINE_REMOVE:
            players = state.players.filter((user) => user.user_id !== action.payload.user_id);

            return {
                ...state,
                players,
            };

        case COMMAND_CHAT_MESSAGE:
            let chat = [...state.chat];
            chat.push(action.payload);

            const length = chat.length - 1;
            if (chat.length > 10) {
                chat = chat.slice(length - 10);
            }

            return {
                ...state,
                chat,
            };

        case CHARACTER_REMOTE_LOGOUT:
        case CHARACTER_LOGOUT:
            return defaultState;
    }

    return state;
}
