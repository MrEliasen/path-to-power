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
                    // let the rest of the network know, a new player joined (add them to the online player list)
                    io.emit('update playerlist', { action: 'add', player: player });
                }

                // Load the inital positon of the player
                mapController.getPlayerPosition(socket.user.userId, function(mapPosition) {
                    socket.user.position = mapPosition;

                    // Add the player to the list of players at the map grid postion
                    mapController.gridUpdatePlayerlist(mapPosition, socket.user, 'add', function(playerlist) {
                        // Send the details of the current postion down to the client.
                        socket.emit('update position', mapPosition, playerlist);
                    });

                    // Let the players in the same grid, see the new player
                    io.sockets.in(`grid_${mapPosition.mapId}_${mapPosition.x}_${mapPosition.y}`).emit('update grid players', {
                        action: 'add',
                        userId: socket.user.userId,
                        display_name: socket.user.display_name
                    });

                    // Join the "room" of the player position
                    socket.join(`grid_${mapPosition.mapId}_${mapPosition.x}_${mapPosition.y}`);
                });

                // Get a list of all online players.
                socket.emit('load playerlist', playerList);
                // Join a room with their userId, used for private messages.
                socket.join(socket.user.userId);
            });
        });

        socket.on('player move', function(direction) {
            // Check if the request contains a valid session token
            authController.checkSocketAuthentication(socket, null, function() {
                // Update the position of the player, if it is a valid move
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

                    // Send the details for the new map grid position to the client
                    socket.emit('update position', newPosition, playerlist);
                    socket.user.position = newPosition;
                });
            });
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                // remove them from the online players list
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