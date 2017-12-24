var Account     = require('../models/account'),
    winston     = require('winston'),
    uuid        = require('uuid/v1'),
    request     = require('superagent'),
    jwt         = require('jsonwebtoken'),
    config      = require('../../../config.json');

function generateSigningToken(user, twitchData, res, callback) {
    jwt.sign({
        userId: user._id,
        display_name: twitchData.display_name,
        twitchId: twitchData.id,
        profile_image_url: twitchData.profile_image_url,
        session_token: user.session_token
    }, config.session.key, { expiresIn: config.session.ttl }, function(err, token) {
        if (err) {
            var ecode = uuid();

            winston.log('error', 'v1/controllers/account/login generateSigningToken', {  
                err: err,
                id: ecode,
            });

            return res.status(500).json({
                status: 500,
                error_code: ecode,
                message: 'An error occured. Please try again in a moment.'
            });
        }

        callback(err, token);
    });
}

exports.login = function (req, res) {
    var ecode = uuid();

    if (!req.body.token) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid authentication request.'
        });
    }

    req.body.token = req.body.token.toString();

    request
        .get('https://api.twitch.tv/helix/users')
        .send()
        .set('Authorization', `Bearer ${req.body.token}`)
        .set('Client-ID', config.twitch.clientId)
        .set('accept', 'json')
        .end((twitchErr, twitchRes) => {
            if (twitchErr) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid authentication request.'
                });
            }

            const twitchData = JSON.parse(twitchRes.text).data[0];

            Account.findOne({ twitchId: escape(twitchData.id) }, { _id: 1, session_token: 1 }, function (err, user) {
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

                if (user) {
                    return generateSigningToken(user, twitchData, res, (err, token) => {
                        res.json({
                            status: 200,
                            user: {
                                display_name: twitchData.display_name,
                                profile_image_url: twitchData.profile_image_url
                            },
                            token: token
                        });
                    });
                }

                user = new Account({
                    twitchId: twitchData.id
                });

                user.save((err) => {
                    if (err) {
                        winston.log('error', 'v1/controllers/account/login Save', {  
                            err: err,
                            id: ecode,
                        });

                        return res.status(500).json({
                            status: 500,
                            error_code: ecode,
                            message: 'An error occured. Please try again in a moment.'
                        });
                    }

                    generateSigningToken(user, twitchData, res, (err, token) => {
                        res.json({
                            status: 200,
                            user: {
                                display_name: twitchData.display_name,
                                profile_image_url: twitchData.profile_image_url
                            },
                            token: token
                        });
                    });
                });
            });
        });
};