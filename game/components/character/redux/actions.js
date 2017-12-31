import {
    CHARACTER_ADD,
    CHARACTER_REMOVE,
    CLIENT_LOAD_CHARACTER,
    CLIENT_CHARACTER_CREATED,
    CLIENT_ADD_TO_PLAYERLIST,
    CLIENT_REMOVE_FROM_PLAYERLIST,
    CLIENT_LOAD_PLAYERLIST } from './types';
import { SERVER_TO_CLIENT } from '../../socket/redux/types';
import { createNotification } from '../../socket/redux/actions';
import { create, loadFromDb } from '../db/controller';

export function addOnlineCharacter(character) {
    return {
        type: CHARACTER_ADD,
        payload: character
    }
}

export function removeOnlineCharacter(character) {
    return {
        type: CHARACTER_REMOVE,
        payload: character
    }
}

export function fetchCharacter(character) {
    return {
        type: CLIENT_LOAD_CHARACTER,
        payload: character
    }
}

export function fetchOnlineCharacters(characterList) {
    return {
        type: CLIENT_LOAD_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: characterList
    }
}

export function broadcastOnlineCharacter(character) {
    return {
        type: CLIENT_ADD_TO_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: {
            user_id: character.user_id,
            name: character.name
        }
    }
}

export function broadcastOfflineCharacter(character) {
    return {
        type: CLIENT_REMOVE_FROM_PLAYERLIST,
        subtype: SERVER_TO_CLIENT,
        payload: {
            user_id: character.user_id,
            name: character.name
        }
    }
}

export function createCharacter(action, socket) {
    return (dispatch, getState, io) => {
        return new Promise((resolve, reject) => {
            create(socket.user.user_id, action, (error, character) => {
                if (error) {
                    return dispatch(createNotification(error.type, error.message, error.title))
                }

                // send character information to socket
                dispatch({
                    ...fetchCharacter(character),
                    subtype: SERVER_TO_CLIENT,
                });

                // set the player in the online player list (server)
                dispatch(addOnlineCharacter(character))
                // announce a player is online
                dispatch(broadcastOnlineCharacter(character));
                // fetch all online players, dispatch to socket
                dispatch(fetchOnlineCharacters(getState().characters.online))

                // dispatch the character back to the client
                dispatch({
                    type: CLIENT_CHARACTER_CREATED,
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta,
                    payload: character
                })

                socket.user.name = character.name;
            })
        })
    }
}

