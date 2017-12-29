import { createStore, applyMiddleware } from 'redux';
import ReduxPromise from 'redux-promise';

import socketIo from 'socket.io';
import config from '../config.json';

import rootReducer from './reducers';
import socket from './components/socket';
import { socketIn, socketOut } from './components/socket/middleware';

// dev tools 
import { composeWithDevTools } from 'remote-redux-devtools';

/*const debug = (store) => next => action => {
    const log = {...action};
    delete log.socket;
    console.log(`=========${action.type}=========`);
    console.log(log);

    next(action);
}*/

const defaultState = {
    players: {},
    npcs: {},
    items: {}
}

export default function (redis, server) {
    const io = socketIo(server);
    io.listen(config.server_port);

    const composeEnhancers = composeWithDevTools({realtime: true, port: 8000});
    const store = createStore(
        rootReducer,
        composeEnhancers(applyMiddleware(socketIn(io), socketOut(io), ReduxPromise))
    );

    socket(store, io);
    return this;
}