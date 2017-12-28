import Account from './model';
import Character from '../../player/db/controller';
import request from 'superagent';
import jwt from 'jsonwebtoken';
import config from '../../../../config.json';

function generateSigningToken(user_id, session_token, callback) {
    jwt.sign({
        user_id: user_id,
        session_token: session_token
    }, config.session.key, { expiresIn: config.session.ttl }, function(err, token) {
        if (err) {
            return callback({
                status: 500,
                error_code: ecode,
                message: 'An error occured. Please try again in a moment.'
            });
        }

        callback(err, token);
    });
}

export function login(auth_data) {
    return new Promise(function(resolve, reject) {
        request
            .get('https://api.twitch.tv/helix/users')
            .send()
            .set('Authorization', `Bearer ${auth_data.twitch_token}`)
            .set('Client-ID', config.twitch.clientId)
            .set('accept', 'json')
            .end((twitchErr, twitchRes) => {
                if (twitchErr) {
                    return reject({
                        status: 401,
                        message: 'Invalid authentication request.'
                    });
                }

                const twitchData = JSON.parse(twitchRes.text).data[0];

                Account.findOne({ twitch_id: escape(twitchData.id) }, { _id: 1, session_token: 1 }, function (err, user) {
                    if (err) {
                        return reject({
                            status: 500,
                            message: 'An error occured. Please try again in a moment.'
                        });
                    }

                    if (!user) {
                        user = new Account({
                            twitch_id: twitchData.id
                        });
                    }

                    user.display_name = twitchData.display_name;

                    user.save((err) => {
                        if (err) {
                            return reject({
                                status: 500,
                                message: 'An error occured. Please try again in a moment.'
                            });
                        }

                        Character.loadFromDb(user._id, function(error, character) {
                            if (error) {
                                return reject({
                                    status: error.status_code,
                                    message: error.message
                                });
                            }

                            // If a character already is created, just login the player
                            if (character) {
                                return generateSigningToken(user._id, user.session_token, (err, token) => {
                                    if (err) {
                                        return reject(err);
                                    }

                                    resolve({
                                        status: 200,
                                        user: {
                                            userId: user._id,
                                            display_name: character.name,
                                            profile_image_url: twitchData.profile_image_url
                                        },
                                        token: token
                                    });
                                });
                            }

                            Character.createNew(user._id, auth_data.character_name, function(error, character) {
                                if (error) {
                                    return reject({
                                        status: error.status_code,
                                        error_code: error.error_code || '',
                                        message: error.message
                                    });
                                }

                                return generateSigningToken(user._id, user.session_token, (err, token) => {
                                    if (err) {
                                        return reject(err);
                                    }

                                    resolve({
                                        status: 200,
                                        user: {
                                            userId: user._id,
                                            display_name: character.name,
                                            profile_image_url: twitchData.profile_image_url
                                        },
                                        token: token
                                    });
                                });
                            })
                        })
                    });
                });
            });
    });
}