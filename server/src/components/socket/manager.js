import {
    USER_AUTHENTICATE,
    USER_LOGOUT,
    CHARACTER_LOGOUT,
    CHARACTER_REMOTE_LOGOUT,
} from 'shared/actionTypes';

import io from 'socket.io';
import EventEmitter from 'events';

/**
 * Socket manager
 */
export default class SocketManager extends EventEmitter {
    /**
     * class constructor
     * @param  {Game}    Game   The game object
     * @param  {Express} server The express/http server object
     */
    constructor(Game, server) {
        super(Game, server);

        this.Game = Game;
        // holds the active socket clients, for logged in users
        this.clients = {};
        // webserver
        this.server = server;
        // setup the socket server
        this.io = io(server);
        // disconnect timers (for DC events)
        this.timers = {};

        this.onDisconnect = this.onDisconnect.bind(this);
        this.clearTimer = this.clearTimer.bind(this);
    }

    /**
     * Get a socket belonging to the user
     * @param  {String} user_id The user id of the user whos socket we are looking for
     * @return {Promise}
     */
    get(user_id) {
        const socket = this.clients[user_id];

        if (!socket) {
            throw new Error(`No socket found for user: ${user_id}`);
        }

        return socket;
    }

    /**
     * Will make the IO server start listening for connections
     */
    listen() {
        // setup event listeners
        this.io.on('connection', this.onConnection.bind(this));

        // listen for connections
        this.server.listen(this.Game.config.app.serverPort);

        console.log(`Socket is listing on port ${this.Game.config.app.serverPort}`);
    }

    /**
     * Handles new connections
     * @param  {Socket.IO Socket} socket
     */
    onConnection(socket) {
        socket.on('dispatch', (action) => {
            this.onClientDispatch(socket, action);
        });

        socket.on('disconnect', () => {
            this.onDisconnect(socket);
        });
    }

    /**
     * Disconnect/logout a user
     * @param  {String} user_id The user_id of the user to logout
     * @return {promise}
     */
    async logoutOutSession(newSocket, user_id) {
        let socket;

        try {
            socket = this.get(user_id);
        } catch (err) {
            return;
        }

        await this.onDisconnect(socket, true);

        this.dispatchToSocket(socket, {
            type: CHARACTER_REMOTE_LOGOUT,
            payload: {},
        });
    }

    /**
     * Add a socket to track in the list
     * @param {Socket.Io object} socket The socket object to track
     */
    add(socket) {
        this.clients[socket.user.user_id] = socket;
    }

    /**
     * Removes a tracked socket reference from the list
     * @param  {String} user_id  User Id of the socket to delete
     */
    remove(user_id) {
        delete this.clients[user_id];
    }

    /**
     * Removes a disconnection timer
     * @param  {String} user_id User Id
     * @return {Boolean} true is a timer was killed.
     */
    clearTimer(user_id) {
        if (this.timers[user_id]) {
            clearTimeout(this.timers[user_id]);
            delete this.timers[user_id];
            return true;
        }

        return false;
    }

    /**
     * Handles socket disconnections
     * @param  {Socket.IO Socket} socket        The socket the request from made from
     * @param  {Bool}             forced        Wether this disconnection was forced or not
     * @param  {Bool}             accountLogout If we should logout the whole account
     */
    async onDisconnect(socket, forced = false, accountLogout = false) {
        const user = socket.user ? {...socket.user} : null;

        // if the user is logged in, set a timer for when we remove them from the game.
        if (user) {
            this.Game.logger.info('Socket disconnected', user);

            // leave the game channel for server-wide events
            socket.leave('game');

            if (accountLogout) {
                socket.user = null;
            }

            if (forced) {
                return this.emit('disconnect', user);
            }

            // save the character as it is right now,
            // once the timer hits, it will save once more.
            try {
                const character = this.Game.characterManager.get(user.user_id);

                if (!character) {
                    return;
                }

                character.killTimers();

                await this.Game.characterManager.save(user.user_id);
            } catch (err) {
                this.Game.onError(err);
            }

            this.timers[user.user_id] = setTimeout(() =>{
                this.emit('disconnect', user);
            }, this.Game.config.game.logout_timer);
        }
    }

    /**
     * Handles new actions from sockets/the clients
     * @param  {Object} action Redux-action object
     */
    onClientDispatch(socket, action) {
        // make sure the actions has an action type and payload.
        if (!action || !action.type) {
            action.type = null;
        }
        if (!action.payload) {
            action.payload = {};
        }

        this.Game.logger.info('New action', {type: action.type});
        // Make sure actions have the right composition
        if (!action.type) {
            return;
        }

        // if the client is not authenticating, but sending dispatches without
        // being authenticated, ignore the request.
        if (!socket.user && action.type !== USER_AUTHENTICATE) {
            return;
        }

        if ([USER_LOGOUT, CHARACTER_LOGOUT].includes(action.type)) {
            this.onDisconnect(socket, false, action.type === USER_LOGOUT);
        }

        // emit the dispatch, which managers listen for
        this.emit('dispatch', socket, action);
    }

    /**
     * Dispatches an action to a specific socket
     * @param  {Socket.IO Socket} socket The socket to dispatch to
     * @param  {Object} action Redux action object
     */
    dispatchToSocket(socket, action) {
        socket.emit('dispatch', action);
    }

    /**
     * Dispatches an action to a specific user
     * @param  {String} user_id  User Id of the account
     * @param  {Object} action   Redux action object
     */
    dispatchToUser(user_id, action) {
        if (!this.clients[user_id]) {
            return;
        }

        this.clients[user_id].emit('dispatch', action);
    }

    /**
     * Dispatches an action to a specific room
     * @param  {String} roomId Room ID/key
     * @param  {Object} action Redux action object
     */
    dispatchToRoom(roomId, action) {
        if (!roomId) {
            throw new Error('Missing roomID in SocketManager::dispatchToRoom');
        }

        this.io.sockets.in(roomId).emit('dispatch', action);
    }

    /**
     * Dispatches an action to the whole server
     * @param  {Object} action Redux action object
     */
    dispatchToServer(action) {
        this.io.emit('dispatch', action);
    }

    /**
     * Get the socket of the user, and join the specific room
     * @param  {String} user_id User ID
     * @param  {String} roomId  Room ID to join
     */
    userJoinRoom(user_id, roomId) {
        const socket = this.get(user_id);
        socket.join(roomId);
    }

    /**
     * Get the socket of the user, and leaves the specific room
     * @param  {String} user_id User ID
     * @param  {String} roomId  Room ID to leaves
     */
    userLeaveRoom(user_id, roomId) {
        const socket = this.get(user_id);
        socket.leave(roomId);
    }
}
