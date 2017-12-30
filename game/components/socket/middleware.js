import { SERVER_TO_CLIENT, CLIENT_TO_SERVER } from './redux/types';
import requestParser from '../../requests';

function dispatchToClient(io, socket, action) {
    // dispatch to client socket only, if no target is set
    if (!action.meta || !action.meta.target) {
        return socket.emit('dispatch', action);
    }

    // check if we need to dispatch to a specific room
    if (action.meta.target !== 'server') {
        return io.sockets.in(action.meta.target).emit('dispatch', action);
    }

    // otherwise, dispatch to the whole server
    io.emit('dispatch', action);
}

exports.socketOut = function(io) {
/*
    {
        type: <server defined action type>,
        subtype: SERVER_TO_CLIENT,
        meta(option): {
            target: 'server|grid_key'
        }
        payload: {
            ...
        }
    }
*/
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

            // if we do not remove the socket from the request, we create a loop.
            const clientAction = {...action}; 
            delete clientAction.socket;

            // dispatch to client(s)
            dispatchToClient(io, action.socket, clientAction);
        }
    }
}

exports.socketIn = function(io) {
/*
    {
        type: <action type set by client>,
        subtype: CLIENT_TO_SERVER,
        payload: {
            ...
        }
    }
*/
    return (store) => {
        return next => async action => {
            // if the action if not the one we want, move along
            if (!action.subtype || action.subtype !== CLIENT_TO_SERVER) {
                return next(action);
            }

            // if there is no parser for the action, merely pass it down the stack
            if (!requestParser[action.type]) {
                return next(action);
            }

            store.dispatch(requestParser[action.type](action, action.socket))
        }
    }
}