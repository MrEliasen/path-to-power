module.exports = function(webServer) {
    // Create SocketIO server and start listening for conection
    var io = require('socket.io')(webServer);
    io.listen(8086);

    // Controllers
    var authController = require('./controllers/authentication');
    var commandController = require('./controllers/commands');

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
                    io.emit('update playerlist', { action: 'add', player: player});
                }

                socket.emit('load playerlist', playerList);
                //socket.join(socket.handshake.session.username); // later, join only the active "square" the user is at.
            });
        });

        socket.on('disconnect', function() {
            if (socket.user) {
                if (playerList[socket.user.userId]) {
                    delete playerList[socket.user.userId];
                }

                io.emit('update playerlist', { action: 'remove', player: socket.user.userId});
            }

            //socket.leave(socket.handshake.session.username);
            socket.disconnect();
        });

        socket.on('send command', function(data, cb) {
            authController.checkSocketAuthentication(socket, cb, function() {
                commandController.parse(io, socket, data);
            });
        });
    });
};