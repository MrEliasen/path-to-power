import { SERVER_TO_CLIENT, CLIENT_TO_SERVER } from '../../core/redux/types';
import parsers from '../../core/parsers';

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

            if (parsers[action.type]) {
                const payload = parsers[action.type](action.payload);

                if (typeof payload.then !== 'function') {
                    return next({
                        type: action.type,
                        payload: payload,
                        socket: action.socket
                    })
                }

                payload
                    .then((result) => {
                        next({
                            type: action.type,
                            payload: result,
                            socket: action.socket
                        })

                        // if its not a new action, ignore it.
                        if (!result.type) {
                            return;
                        }

                        // attach the socket to the new action.
                        result.socket = action.socket;
                        store.dispatch(result);
                    })
                    .catch((result) => {
                        // if its not a new action, ignore it.
                        if (result.type) {
                            // attach the socket to the new action.
                            store.dispatch({
                                ...result,
                                socket: action.socket
                            });
                        }

                        next({
                            type: action.type,
                            payload: result
                        })
                    })
            } else {
                next(action);
            }
        }
    }
}