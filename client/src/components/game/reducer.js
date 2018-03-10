import {
    ADD_ONLINE_PLAYER,
    REMOVE_ONLINE_PLAYER,
    CHAT_MESSAGE,
    NEWS_UPDATE,
} from './types';
import {ACCOUNT_AUTHENTICATE_SUCCESS} from '../account/types';
import {CHARACTER_LOGIN} from './character/types';
import {REMOTE_LOGOUT} from '../../shared/types';
import {GAME_LOGOUT} from './types';
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
        case NEWS_UPDATE:
            return {
                ...state,
                news: {
                    message: action.payload,
                    colour: getRandomColour(),
                },
            };

        case CHARACTER_LOGIN:
        case ACCOUNT_AUTHENTICATE_SUCCESS:
            return {
                ...state,
                ...action.payload.gameData,
            };

        case ADD_ONLINE_PLAYER:
            players = state.players.filter((user) => user.user_id !== action.payload.user_id);
            players.push(action.payload);

            return {
                ...state,
                players,
            };

        case REMOVE_ONLINE_PLAYER:
            players = state.players.filter((user) => user.user_id !== action.payload.user_id);

            return {
                ...state,
                players,
            };

        case CHAT_MESSAGE:
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

        case REMOTE_LOGOUT:
        case GAME_LOGOUT:
            return defaultState;
    }

    return state;
}
