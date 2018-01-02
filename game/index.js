import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import socketIo from 'socket.io';

import config from '../config.json';
import rootReducer from './reducers';
import socket from './components/socket';
import { socketOut } from './components/socket/middleware';

// dev tools
import { composeWithDevTools } from 'remote-redux-devtools';

// components
import { initialiseMaps } from './components/map';
import { initialiseItems } from './components/item';
import { initialiseShops } from './components/shop';
import { autoSave } from './components/character/db/controller';

export default async function (redis, server) {
    const io = socketIo(server);
    const composeEnhancers = composeWithDevTools({realtime: true, port: 8000});
    const store = createStore(
        rootReducer,
        composeEnhancers(applyMiddleware(thunk.withExtraArgument(io), socketOut(io)))
    );

    console.log('===== LOADING GAME DATA =====');
    await initialiseMaps(store.dispatch).then(() => {
        console.log('MAPS DONE');
    })
    await initialiseItems(store.dispatch).then(() => {
        console.log('ITEMS DONE');
    })
    await initialiseShops(store.dispatch).then(() => {
        console.log('SHOPS DONE');
    })
    console.log('===== ===== ===== ===== =====');

    socket(store, io);
    io.listen(config.server_port);

    if (config.game.autosave.enabled) {
        const autoSaveInterval = setInterval(() => {
            const characters = store.getState().characters.list;
            Object.keys(characters).map((user_id) => {
                autoSave(characters[user_id]);
            })
        }, config.game.autosave.interval)
    }

    return this;
}