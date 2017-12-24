module.exports = function(webServer) {
    var authController = require('./controllers/authentication');

    var io = require('socket.io')(webServer);
    io.listen(8086);

    io.on('connection', function(socket) {
        socket.on("authenticate", function(data, cb){
            authController.socketLogin(socket, cb, function() {
                socket.join('global');
                //socket.join(socket.handshake.session.username); // later, join only the active "square" the user is at.
            });
        });

        socket.on('disconnect', function(){
            //socket.leave(socket.handshake.session.username);
            socket.leave('global');
            socket.disconnect();
        });
    });
};