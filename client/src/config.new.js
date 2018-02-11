const Config = {
    socket: {
        host: 'http://localhost:8086',
    },
    twitch: {
        callbackUrl: 'http://localhost:8080/auth',
        clientId: '',
        scope: [
            'user_read',
        ],
    },
};

export default Config;
