var Account     = require('../models/account'),
    jwt         = require('jsonwebtoken'),
    moment      = require('moment'),
    winston     = require('winston'),
    uuid        = require('uuid/v1'),
    RFC2822     = require('../../../config.json')['rfc2822'];

// Create endpoint /api/auth for POST
exports.login = function (req, res) {
    var ecode = uuid();

    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            status: 400,
            message: 'You must provide both an email and a password.'
        });
    }

    req.body.email = req.body.email.toString().toLowerCase();
    req.body.password = req.body.password.toString();

    Account.findOne({ email: req.body.email }, {_id: 1, password: 1, name: 1, email: 1, session_token: 1, pin_encrypted: 1, pin_iv: 1, question: 1, answer: 1}, function (err, user) {
        if (err) {
            winston.log('error', 'v1/controllers/account/login Find', {  
                err: err,
                id: ecode,
            });

            return res.status(500).json({
                status: 500,
                error_code: ecode,
                message: 'An error occured while attempting to log you in. Please try again in a moment.'
            });
        }

        // No user found with that username
        if (!user) {
            return res.status(400).json({
                status: 400,
                message: 'The email and password combination is invalid.'
            });
        }

        // Make sure the password is correct
        user.verifyPassword(req.body.password, function(err, isMatch) {
            if (err) {
                winston.log('error', 'v1/controllers/account/login VERIFY', {  
                    err: err,
                    id: ecode,
                });

                return res.status(500).json({
                    status: 500,
                    error_code: ecode,
                    message: 'An error occured while attempting to log you in. Please try again in a moment.'
                });
            }

            // Password did not match
            if (!isMatch) {
                return res.status(400).json({
                    status: 400,
                    message: 'The email and password combination is invalid'
                });
            }

            res.json({
                status: 200
            });
        });
    });
};