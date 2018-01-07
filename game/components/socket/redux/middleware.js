import { SERVER_TO_CLIENT, CLIENT_TO_SERVER } from './redux/types';

/**
 * Emits an event to the client/room/server
 * @param  {Object} io     Socket.io server
 * @param  {Mixed}  meta   Tells the function where or who to emit the event to
 * @param  {Object} action Redux action object
 */
function dispatchToClient(io, meta, action) {
    // dispatch to client socket only, if no target is set
    if (meta.socket_id && (!action.meta || !action.meta.target)) {
        return io.to(meta.socket_id).emit('dispatch', action);
    }

    // check if we need to dispatch to a specific room
    if (action.meta && action.meta.target !== 'server') {
        return io.sockets.in(action.meta.target).emit('dispatch', action);
    }

    // otherwise, dispatch to the whole server
    io.emit('dispatch', action);
}

/**
 * Checks if an action is meant to be emited to the client or not 
 * @param  {Object} io Socket.io server, passed from the Thunk middleware
 */
exports.socketOut = function(io) {
    return (store) => {
        return next => action => {
            // This middleware only check for the SERVER_TO_CLIENT type. If an action
            // is not of this type, we pass it along.
            if (!action.subtype || action.subtype !== SERVER_TO_CLIENT) {
                return next(action);
            }

            // remove subtype so the action does not trigger this middleware again
            delete action.subtype;

            // pass the action along to the server reducers, should we need to do anything.
            next(action);

            // Dispatch the action to the client(s), based on the meta data.
            dispatchToClient(io, action.meta || {}, action);
        }
    }
}