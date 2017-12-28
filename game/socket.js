import socketIo from 'socket.io';

// import redux actions
import { addOnlinePlayer, removeOnlinePlayer } from './core/redux/actions';
import { accountLogin } from './components/account/redux/actions';

export default function(store, server) {
    const io = socketIo(server);
    io.listen(8086);

    io.on('connection', function(socket) {
        socket.on('authenticate', function(data) {
            store.dispatch(accountLogin(data));
        })

        socket.on('disconnect', function() {
            if (socket.user) {
                //store.dispatch(removeOnlinePlayer(socket.user));
            }

            socket.disconnect();
        });
    });
}