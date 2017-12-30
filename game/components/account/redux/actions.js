import { PLAYER_ADD, PLAYER_REMOVE } from '../../player/redux/types';
import { login } from '../db/controller';

export function accountLogin(socket, auth_data) {
    return function (dispatch, getState) {
        login(auth_data)
            .then((returnAction) => {
                dispatch({
                    type: PLAYER_ADD,
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
            type: PLAYER_REMOVE,
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