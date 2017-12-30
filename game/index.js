import { createStore, applyMiddleware } from 'redux';
//import ReduxPromise from 'redux-promise';
import thunk from 'redux-thunk';
import socketIo from 'socket.io';

import config from '../config.json';
import rootReducer from './reducers';
import socket from './components/socket';
import { socketIn, socketOut } from './components/socket/middleware';

// dev tools 
import { composeWithDevTools } from 'remote-redux-devtools';

export default function (redis, server) {
    const io = socketIo(server);
    io.listen(config.server_port);

    const composeEnhancers = composeWithDevTools({realtime: true, port: 8000});
    const store = createStore(
        rootReducer,
        composeEnhancers(applyMiddleware(socketIn(io), socketOut(io), thunk.withExtraArgument(io)))
    );

    socket(store, io);
    return this;
}