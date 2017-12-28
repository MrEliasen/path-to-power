// import redux actions
import { addOnlinePlayer, removeOnlinePlayer } from './core/redux/actions';
import { accountLogin } from './components/account/redux/actions';

export default function(store, io) {
    io.on('connection', function(socket) {
        socket.on('authenticate', function(data) {
            store.dispatch(accountLogin(socket, data));
        })

        // validate or limit actions from the client,
        // else they could run havoc and call everyone on the server.
        socket.on('dispatch', store.dispatch);

        socket.on('disconnect', function() {
            if (socket.user) {
                //store.dispatch(removeOnlinePlayer(socket.user));
            }

            socket.disconnect();
        });
    });
}