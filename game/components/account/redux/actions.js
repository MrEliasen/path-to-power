import { ACCOUNT_AUTHENTICATE } from './types';
import { GAME_ADD_PLAYER, GAME_REMOVE_PLAYER } from '../../../core/redux/types';
import { login } from '../db/controller';

/*export function accountLogin(socket, auth_data) {
    return {
        type: ACCOUNT_AUTHENTICATE,
        payload: login(auth_data)
    }
}*/

export function accountLogin(socket, auth_data) {
    return function (dispatch, getState) {
        login(auth_data)
            .then((returnAction) => {
                dispatch({
                    type: GAME_ADD_PLAYER,
                    payload: {
                        name: returnAction.payload.name,
                        user_id: returnAction.payload.user_id
                    }
                });

                socket.join(returnAction.payload.user_id);
                socket.emit('dispatch', returnAction);
            })
            .catch((returnAction) => {
                socket.emit('dispatch', returnAction);
            });
    }
}

export function accountLogout(user_id) {
    return function (dispatch, getState, io) {
        dispatch({
            type: GAME_REMOVE_PLAYER,
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