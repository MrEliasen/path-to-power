// Load required packages
var Account = require('../models/account'),
    jwt     = require('jsonwebtoken'), // https://www.npmjs.com/package/jsonwebtoken
    winston = require('winston'),
    moment  = require('moment'),
    uuid    = require('uuid/v1'),
    config  = require('../../../config.json');

function checkJsonToken(token, callback) {
    try {
        var decoded = jwt.verify(token, config.session.key);

        Account.findOne({_id: escape(decoded.userId), session_token: escape(decoded.session_token)}, {_id: 1}, function (err, user) {
            if (err) {
                winston.log('error', 'v1/controllers/authentication/authenticate find', {  
                    err: err,
                    id: uuid()
                });

                return callback({
                    status: 401,
                    error: "You do not have permission to access this endpoint."
                });
            }

            // No user found with that username
            if (!user) {
                return callback({
                    status: 401,
                    error: "You do not have permission to access this endpoint."
                });
            }

            callback(null, decoded);
        });
    } catch(err) {
        return callback({
            status: 401,
            error: "You do not have permission to access this endpoint."
        });
    }
};

exports.socketLogin = function(socket, data, cb, callback) {
    cb = cb || function() {};

    if (!data.token) {
        return cb("Invalid or missing data.", null);
    }

    checkJsonToken(data.token, function(err, decoded_data) {
        // No user found with that username
        if (err) {
            return cb(err.error, null);
        }

        socket.user = {
            userId: decoded_data.userId,
            twitchId: decoded_data.twitchId,
            display_name: decoded_data.display_name,
            profile_image_url: decoded_data.profile_image_url
        };
        callback(null);
    });
};

exports.checkSocketAuthentication = function(socket, cb, callback) {
    cb = cb || function() {};
    callback = callback || function() {};
    
    if (!socket.user.userId) {
        return cb('Authentication error', null);
    }

    callback();
};

exports.authenticate = function(req, res, cb) {
    var token = req.headers.token;

    checkJsonToken(token, function (err, decoded_data) {
        // No user found with that username
        if (err) {
            return res.status(401).json(err);
        }

        req.user = decoded_data._id;
        cb();
    });
};