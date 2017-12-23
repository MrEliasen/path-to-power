// Load required packages
var Account = require('../models/account'),
    jwt     = require('jsonwebtoken'), // https://www.npmjs.com/package/jsonwebtoken
    winston = require('winston'),
    moment  = require('moment'),
    uuid    = require('uuid/v1'),
    RFC2822 = require('../../../config.json')['rfc2822'];

exports.authenticate = function(req, res, cb) {
    var token = req.headers.token;

    try {
        var decoded = jwt.verify(token, req.app.get('config').session.key);

        Account.findOne({_id: escape(decoded.data._id), session_token: escape(decoded.data.session_token)}, {_id: 1}, function (err, user) {
            if (err) {
                winston.log('error', 'v1/controllers/authentication/authenticate find', {  
                    err: err,
                    id: uuid()
                });

                return res.status(401).json({
                    status: 401,
                    error: "You do not have permission to access this endpoint."
                });
            }

            // No user found with that username
            if (!user) {
                return res.status(401).json({
                    status: 401,
                    error: "You do not have permission to access this endpoint."
                });
            }

            req.user = decoded.data._id;
            cb();
        });
    } catch(err) {
        return res.status(401).json({
            status: 401,
            error: "You do not have permission to access this endpoint."
        });
    }
};