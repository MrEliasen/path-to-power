import io from 'socket.io';
import EventEmitter from 'events';

export default class SocketManager extends EventEmitter {
    constructor(Game, server) {
        super(Game, server);

        this.Game = Game;
        // holds the active socket clients, for logged in users
        this.clients = {};
        // setup the socket server
        this.io = io(server);
        // disconnect timers (for DC events)
        this.timers = {};

        this.onDisconnect = this.onDisconnect.bind(this)
        this.clearTimer = this.clearTimer.bind(this);
    }

    get(user_id) {
        return new Promise((resolve, reject) => {
            const socket = this.clients[user_id];

            if (!socket) {
                return reject(`No socket found for user: ${user_id}`);
            }

            resolve(socket);
        })
    }

    /**
     * Will make the IO server start listening for connections
     */
    listen() {
        this.Game.logger.info(`Socket is listing on port ${this.Game.config.server_port}`)
        // setup event listeners
        this.io.on('connection', this.onConnection.bind(this));

        // listen for connections
        this.io.listen(this.Game.config.server_port);
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
     * Handles new connections
     * @param  {Socket.IO Socket} socket
     */
    onConnection(socket) {
        socket.on('dispatch', (action) => {
            this.onClientDispatch(socket, action)
        });
        socket.on('disconnect', () => {
            this.onDisconnect(socket);
        });
    }

    /**
     * Handles socket disconnections
     * @param  {Socket.IO Socket} socket
     */
    onDisconnect(socket, forced = false) {
        this.Game.logger.info('Socket disconnected', socket.user);

        // if the user is logged in, set a timer for when we remove them from the game.
        if (socket.user) {
            const user = {...socket.user};

            if (forced) {
                return this.emit('disconnect', user);
            }

            this.timers[socket.user.user_id] = setTimeout(() =>{
                this.emit('disconnect', user)
            }, this.Game.config.game.logout_timer)
        }
    }

    /**
     * Handles new actions from sockets/the clients
     * @param  {Object} action Redux-action object
     */
    onClientDispatch(socket, action) {
        this.Game.logger.info('New action', action);
        // Make sure actions have the right composition
        if (!action.payload || !action.type) {
            return;
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
        if (!user_id) {
            console.log('Missing user_id from dispatchToUser?:', user_id, ' for action:', action);
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
            console.log('Missing roomId from dispatchToRoom?:', roomId, ' for action:', action);
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
}