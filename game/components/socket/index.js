// import redux actions
import { CLIENT_TO_SERVER } from '../../core/redux/types';
import { removeOnlinePlayer } from '../../core/redux/actions';
import { accountLogin } from '../account/redux/actions';

export default function(store, io) {
    io.on('connection', function(socket) {
        socket.on('dispatch', (data) => {
            store.dispatch({
                ...data,
                subtype: CLIENT_TO_SERVER,
                socket: socket
            });
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                store.dispatch(removeOnlinePlayer(socket.user || null));
            }

            socket.disconnect();
        });
    });
}