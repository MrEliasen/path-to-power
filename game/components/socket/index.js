// import redux actions
import { CLIENT_TO_SERVER, CLIENT_AUTH_SUCCESS } from './redux/types';
import { removeOnlineCharacter, broadcastOfflineCharacter, saveAccountCharacter } from '../character/redux/actions';
import requestParser from '../../requests';

export default function(store, io) {
    io.on('connection', function(socket) {
        socket.on('dispatch', (action) => {
            action.meta = {
                socket_id: socket.id,
            }

            // if there is no parser for the action, merely pass it down the stack
            if (!requestParser[action.type]) {
                return store.dispatch(action);
            }

            const request = requestParser[action.type](action, socket);

            if (typeof request.then !== 'function') {
                return store.dispatch(request)
            }

            store
                .dispatch(request)
                .catch(console.log);
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                const save = store.dispatch(saveAccountCharacter(socket.user.user_id))
                save.then(() => {
                    store.dispatch(removeOnlineCharacter(socket.user))
                    store.dispatch(broadcastOfflineCharacter(socket.user))
                })
                .catch(console.log)
            }

            socket.disconnect();
        });
    });
}