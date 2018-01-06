// import request parses
import requestParsers from '../../requests';
import {
    removeOnlineCharacter,
    broadcastOfflineCharacter,
    saveAccountCharacter
} from '../character/redux/actions';

/**
 * Sets up the event listeners
 * @param  {Object} store Redux Store object
 * @param  {Object} io    Socket.io server object
 */
export default function(store, io) {
    io.on('connection', function(socket) {
        socket.on('dispatch', (action) => {
            // we will only receive requests from the client which has a type and payload. Ignore any other requests which has a different composition
            if (!action.payload || !action.type) {
                return;
            }

            // The meta object tracks the socket id, should we need to return a response to the specific client.
            action.meta = {
                socket_id: socket.id,
            }

            // We check if we have a request parser for the specific action type.
            // if we dont, we just pass the request down the stack
            if (!requestParsers[action.type]) {
                return store.dispatch(action);
            }

            // get the request parser for the request
            const request = requestParsers[action.type](action, socket);

            // If the request parser didn't return promise, we just dispatch the output.
            if (typeof request.then !== 'function') {
                return store.dispatch(request)
            }

            // TODO: add socket.user check within commands, actions etc. in case of staggered actions firing before client reconnet.
            // if the request parser did return a promise, we wait for it to finish,
            // and dispatch the request
            request.catch(console.log);
        });

        socket.on('disconnect', function() {
            // if the client was authenticated
            if (socket.user) {
                // we save the character of the account 
                const save = store.dispatch(saveAccountCharacter(socket.user.user_id))
                save.then(() => {
                    // and let the connected clients know a player disconnected (removing them from the player list etc)
                    store.dispatch(removeOnlineCharacter(socket.user))
                    store.dispatch(broadcastOfflineCharacter(socket.user))
                })
                .catch(console.log)
            }

            socket.disconnect();
        });
    });
}