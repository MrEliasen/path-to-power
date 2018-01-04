import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import socketIo from 'socket.io';
import rootReducer from './reducers';
import config from '../config.json';

// dev tools
import { composeWithDevTools } from 'remote-redux-devtools';

// components
import socket from './components/socket';
import { socketOut } from './components/socket/middleware';
import { initialiseMaps } from './components/map/init';
import { initialiseItems } from './components/item/init';
import { initialiseShops } from './components/shop/init';
import { autoSave } from './components/character/db/controller';

/**
 * Initiate the game server and data.
 * @param  {Object} redis  Redis client object
 * @param  {Object} server [description]
 * @return {object}        Return the object of the function
 */
export default async function (redis, server) {
    // Setup the socket.io server and setup remote Redux dev tools
    const io = socketIo(server);
    const composeEnhancers = composeWithDevTools({realtime: true, port: 8000});
    const store = createStore(
        rootReducer,
        composeEnhancers(applyMiddleware(thunk.withExtraArgument(io), socketOut(io)))
    );

    // Load all of the requred game data before we allow clients to connect.
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

    // Setup the socket listeners, and run the game
    socket(store, io);
    // Listen for client connections
    io.listen(config.server_port);

    // Run the auto-save feature if enabled in the config.
    if (config.game.autosave.enabled) {
        const autoSaveInterval = setInterval(() => {
            // will fetch all the characters from the redux store
            const characters = store.getState().characters.list;
            // loop them and save them all to the MongoDB
            Object.keys(characters).map((user_id) => {
                autoSave(characters[user_id]);
            })
        }, config.game.autosave.interval)
    }

    return {
        shutdown: () => {
            console.log('Shutdown proceedure running.')
        }
    };
}