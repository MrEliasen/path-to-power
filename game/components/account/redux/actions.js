import { CHARACTER_REMOVE } from '../../character/redux/types';
import { CLIENT_AUTH_SUCCESS, SERVER_TO_CLIENT } from '../../socket/redux/types';

import { login } from '../db/controller';
import { createNotification } from '../../socket/redux/actions';

export function accountLogin(action, socket) {
    return (dispatch, getState, io) => {
        return new Promise((resolve, reject) => {
            login(action, (error, account) => {
                if (error) {
                    return dispatch(createNotification(error.type, error.message, error.title))
                }

                dispatch({
                    type: CLIENT_AUTH_SUCCESS,
                    subtype: SERVER_TO_CLIENT,
                    meta: action.meta,
                    payload: account
                })

                socket.user = {
                    user_id: account.user_id,
                    name: account.name
                };
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