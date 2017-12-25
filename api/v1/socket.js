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
                mapController.getPlayerPosition(socket.user.twitchId, function(mapPosition) {
                    socket.emit('update position', mapPosition);
                });

                socket.emit('load playerlist', playerList);
                // Join a room with their twitchId, used for private messages.
                socket.join(socket.user.twitchId);
                // Join a room by map location, for local message.
                // TBD
            });
        });

        socket.on('player move', function(direction) {
            mapController.setPlayerPosition(socket.user.twitchId, direction, function(mapPosition) {
                socket.emit('update position', mapPosition);
            });
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                if (playerList[socket.user.userId]) {
                    delete playerList[socket.user.userId];
                }

                io.emit('update playerlist', { action: 'remove', player: socket.user.userId});

                // Leave the private message channel for the client
                socket.leave(socket.user.twitchId);
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