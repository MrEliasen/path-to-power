module.exports = async function(webServer, app) {
    // Create SocketIO server and start listening for conection
    var io = require('socket.io')(webServer);
    io.listen(8086);

    // Controllers
    var authController      = require('./controllers/authentication');
    var commandController   = require('./controllers/commands');
    var mapController       = require('./controllers/map');

    // init the controllers, which depends on redis
    await mapController.init(app);

    // Game variables
    const playerList = {};

    io.on('connection', function(socket) {
        // Authenticate the user upon login.
        // Send player list on success.
        socket.on("authenticate", function(data, cb){
            authController.socketLogin(socket, data, cb, function(err) {
                // Check if the player is already in the "online players list"; if not, add them!
                if (!Object.keys(playerList).includes(socket.user.userId)) {
                    const player = {
                        userId: socket.user.userId,
                        profile_image_url: socket.user.profile_image_url,
                        display_name: socket.user.display_name
                    };

                    playerList[socket.user.userId] = player;
                    io.emit('update playerlist', { action: 'add', player: player });
                }

                // Load the inital positon of the player, and sends it to the client.
                mapController.getPlayerPosition(socket.user.userId, function(mapPosition) {
                    socket.user.position = mapPosition;

                    mapController.gridUpdatePlayerlist(mapPosition, socket.user, 'add', function(playerlist) {
                        socket.emit('update position', mapPosition, playerlist);
                    });

                    // send remove player from grid to clients
                    io.sockets.in(`grid_${mapPosition.mapId}_${mapPosition.x}_${mapPosition.y}`).emit('update grid players', {
                        action: 'add',
                        userId: socket.user.userId,
                        display_name: socket.user.display_name
                    });

                    socket.join(`grid_${mapPosition.mapId}_${mapPosition.x}_${mapPosition.y}`);
                });

                socket.emit('load playerlist', playerList);
                // Join a room with their userId, used for private messages.
                socket.join(socket.user.userId);
                // Join a room by map location, for local message.
            });
        });

        socket.on('player move', function(direction) {
            authController.checkSocketAuthentication(socket, null, function() {
                mapController.setPlayerPosition(socket.user, direction, function(oldPosition, newPosition, playerlist) {
                    const newGridKey = `grid_${newPosition.mapId}_${newPosition.x}_${newPosition.y}`;
                    const oldGridKey = `grid_${oldPosition.mapId}_${oldPosition.x}_${oldPosition.y}`;

                    // Send leave events to the players in the old grid
                    socket.leave(oldGridKey);
                    io.sockets.in(oldGridKey).emit('update grid players', {
                        action: 'remove',
                        userId: socket.user.userId
                    });

                    // Send join events to the player in the new grid
                    socket.join(newGridKey);
                    io.sockets.in(newGridKey).emit('update grid players', {
                        action: 'add',
                        display_name: socket.user.display_name,
                        userId: socket.user.userId
                    });

                    socket.emit('update position', newPosition, playerlist);
                    socket.user.position = newPosition;
                });
            });
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                if (playerList[socket.user.userId]) {
                    delete playerList[socket.user.userId];
                }

                // remove player from the online players list
                io.emit('update playerlist', { action: 'remove', player: socket.user.userId});
                // remove the player from the grid (redis)
                mapController.gridUpdatePlayerlist(socket.user.position, socket.user, 'remove');
                // send remove player from grid to clients
                io.sockets.in(`grid_${socket.user.position.mapId}_${socket.user.position.x}_${socket.user.position.y}`).emit('update grid players', {
                    action: 'remove',
                    userId: socket.user.userId
                });
            }

            socket.disconnect();
        });

        socket.on('send command', function(data, cb) {
            authController.checkSocketAuthentication(socket, cb, function() {
                commandController.parse(io, socket, data);
            });
        });
    });
};