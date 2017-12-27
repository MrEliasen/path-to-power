module.exports = function(webServer, app) {
    // Create SocketIO server and start listening for conection
    var io = require('socket.io')(webServer);
    io.listen(8086);

    // Controllers
    const gameConfig          = require('./config.json');
    const gameController      = require('./controllers/game');
    const authController      = require('./controllers/authentication');
    const commandController   = require('./controllers/commands');
    const mapController       = require('./controllers/map');
    const characterController = require('./controllers/character');

    // init the controllers, which depends on redis
    mapController.init(app);
    characterController.init(app, mapController, io);
    commandController.init(characterController);

    io.on('connection', function(socket) {
        socket.on("authenticate", function(data, cb) {
            authController.socketLogin(socket, data, cb, function(err) {
                // Join a room with their userId, used for private messages.
                socket.join(socket.user.userId);
                socket.emit('update game data', gameController.fetchGameData())

                const player = {
                    userId: socket.user.userId,
                    profile_image_url: socket.user.profile_image_url,
                    display_name: socket.user.display_name
                };
                
                gameController.addOnlinePlayer(socket.user.userId, player, function() {
                    // let the rest of the network know, a new player joined (add them to the online player list)
                    io.emit('update playerlist', { action: 'add', player: player });
                })

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
                    characterController.updatePlayerSocket(socket.user.userId);
                });

                // Get a list of all online players.
                socket.emit('load playerlist', gameController.getPlayerList('online'));
                characterController.getInventory(socket.user.userId, function(inventory) { 
                    socket.emit('update inventory', inventory)
                })
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
                gameController.addOfflinePlayer(socket.user.userId, function() {
                    // remove player from the online players list
                    io.emit('update playerlist', { action: 'remove', player: socket.user.userId});
                    // remove the player from the grid (redis)
                    mapController.gridUpdatePlayerlist(socket.user.position, socket.user, 'remove');
                    // send remove player from grid to clients
                    io.sockets.in(`grid_${socket.user.position.mapId}_${socket.user.position.x}_${socket.user.position.y}`).emit('update grid players', {
                        action: 'remove',
                        userId: socket.user.userId
                    });
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

    if (gameConfig.autosave.enabled) {         
        // run the "auto-save" every x interval
        let autosave = setInterval(() => {
            gameController.saveAll();
        }, gameConfig.autosave.interval);
    }

    return {
        shutdown: gameController.shutdown
    };
};