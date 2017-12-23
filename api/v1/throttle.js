var limiter = require('express-limiter');

exports.init = function(app) {
    limiter(app, app.get('redis'))({
        path: '/api/v1/auth',
        method: 'post',
        lookup: ['connection.remoteAddress'],
        total: 10,
        expire: 1000 * 60 * 15,
        onRateLimited: function (req, res, next) {
            next({
                status: 429,
                message: 'Too many failed login attempts in short succession. Please try again in 15 minutes.',
            });
        }
    });
};