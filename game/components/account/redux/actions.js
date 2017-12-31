import { CHARACTER_REMOVE } from '../../character/redux/types';
import { CLIENT_AUTH_SUCCESS, SERVER_TO_CLIENT } from '../../socket/redux/types';

import { login } from '../db/controller';
import { loadFromDb } from '../../character/db/controller';
import { fetchCharacter, fetchOnlineCharacters, addOnlineCharacter, broadcastOnlineCharacter } from '../../character/redux/actions';
import { createNotification } from '../../socket/redux/actions';

export function accountLogin(action, socket) {
    return (dispatch, getState, io) => {
        return new Promise((resolve, reject) => {
            login(action, (error, account) => {
                if (error) {
                    dispatch(createNotification(error.type, error.message, error.title))
                    return resolve();
                }

                loadFromDb(account.user_id, (err, character) => {
                    dispatch({
                        type: CLIENT_AUTH_SUCCESS,
                        subtype: SERVER_TO_CLIENT,
                        meta: action.meta,
                        payload: account
                    })

                    if (character) { 
                        // send character information to socket
                        dispatch({
                            ...fetchCharacter(character),
                            subtype: SERVER_TO_CLIENT,
                            meta: action.meta,
                        });

                        // set the player in the online player list (server)
                        dispatch(addOnlineCharacter(character))
                        // announce a player is online
                        dispatch(broadcastOnlineCharacter(character));
                        // fetch all online players, dispatch to socket
                        dispatch({
                            ...fetchOnlineCharacters(getState().characters.online),
                            meta: action.meta
                        })
                    }

                    socket.user = {
                        user_id: account.user_id,
                        name: account.name
                    }

                    resolve();
                })
            })
        })
    }
}

export function accountLogout(user_id) {
    return function (dispatch, getState, io) {
        dispatch({
            type: CHARACTER_REMOVE,
            payload: {
                user_id: user_id
            }
        });

        io.sockets.in(user_id).emit('dispatch', {
            type: 'some-dc-type',
            payload: {}
        });
    }
}