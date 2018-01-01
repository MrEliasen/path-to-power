import { SERVER_TO_CLIENT, CLIENT_TO_SERVER } from './redux/types';

function dispatchToClient(io, socket_id, action) {
    // dispatch to client socket only, if no target is set
    if (socket_id && (!action.meta || !action.meta.target)) {
        return io.to(socket_id).emit('dispatch', action);
    }

    // check if we need to dispatch to a specific room
    if (action.meta && action.meta.target !== 'server') {
        return io.sockets.in(action.meta.target).emit('dispatch', action);
    }

    // otherwise, dispatch to the whole server
    io.emit('dispatch', action);
}

exports.socketOut = function(io) {
    return (store) => {
        return next => action => {
            // if the action if not the one we want, move along
            if (!action.subtype || action.subtype !== SERVER_TO_CLIENT) {
                return next(action);
            }

            // remove subtype so the action does not trigger this middleware again
            delete action.subtype;

            // pass along to the server reducers
            next(action);

            // dispatch to client(s)
            dispatchToClient(io, (action.meta ? action.meta.socket_id : null), action);
        }
    }
}

/*
    {
        type: <server defined action type>,
        subtype: SERVER_TO_CLIENT,
        meta(option): {
            target: 'server|grid_key',
            socket_id: 123123
        }
        payload: {
            ...
        }
    }
*/