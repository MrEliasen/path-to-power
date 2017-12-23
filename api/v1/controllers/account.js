var Account     = require('../models/account'),
    winston     = require('winston'),
    uuid        = require('uuid/v1');

function checkEmail(email) {
    if (!email.includes('@')) {
        return false;
    }

    if (!email.includes('.')) {
        return false;
    }

    return true;
}

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

    Account.findOne({ email: req.body.email }, {_id: 1, password: 1}, function (err, user) {
        if (err) {
            winston.log('error', 'v1/controllers/account/login Find', {  
                err: err,
                id: ecode,
            });

            return res.status(500).json({
                status: 500,
                error_code: ecode,
                message: 'An error occured. Please try again in a moment.'
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
                    message: 'An error occured. Please try again in a moment.'
                });
            }

            // Password did not match
            if (!isMatch) {
                return res.status(400).json({
                    status: 400,
                    message: 'The email and password combination is invalid'
                });
            }

            jwt.sign({
                _id: user._id,
                session_key: user.session_key
            }, config.session.key, { expiresIn: config.session.ttl }, function(err, token) {
                if (err) {
                    return res.status(500).json({
                        status: 500,
                        message: 'An error occured. Please try again in a moment.'
                    });
                }

                res.json({
                    status: 200,
                    userId: user._id,
                    token: token
                });
            });
        });
    });
};

exports.signup = function (req, res) {
    var ecode = uuid();

    if (!req.body.email || !req.body.password) {
        return res.status(400).json({
            status: 400,
            message: 'Please fill out all the frield in the sign up form.'
        });
    }

    req.body.email = req.body.email.toString().toLowerCase().trim();
    req.body.password = req.body.password.toString();

    if (!checkEmail(req.body.email)) {
        return res.status(400).json({
            status: 400,
            message: 'The email does not appear to be valid.'
        });
    }

    Account.findOne({ email: req.body.email }, { _id: 1 }, function (err, user) {
        if (err) {
            winston.log('error', 'v1/controllers/account/signup findOne', {  
                err: err,
                id: ecode,
            });

            return res.status(500).json({
                status: 500,
                error_code: ecode,
                message: 'An error occured. Please try again in a moment.'
            });
        }

        // No user found with that username
        if (user) {
            return res.status(400).json({
                status: 400,
                message: 'An account already exists, using that email account.'
            });
        }

        let newAccount = new Account({
            password: req.body.password,
            email: req.body.email
        });

        newAccount.save(function(err) {
            if (err) {
                winston.log('error', 'v1/controllers/account/signup findOne', {  
                    err: err,
                    id: ecode,
                });

                return res.status(500).json({
                    status: 500,
                    error_code: ecode,
                    message: 'An error occured. Please try again in a moment.'
                });
            }

            return res.status(203).json({
                status: 203,
                message: 'Your account was created successfully!'
            });
        });
    });
};