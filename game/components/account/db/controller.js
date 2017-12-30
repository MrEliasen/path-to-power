import Account from './model';
import Character from '../../player/db/controller';
import request from 'superagent';
import jwt from 'jsonwebtoken';
import Promise from 'bluebird';
import config from '../../../../config.json';

import { PROMPT_CREATE_CHARACTER, SERVER_TO_CLIENT, NOTIFICATION_SET, AUTH_LOGIN_SUCCESS } from '../../../core/redux/types';
import { addOnlinePlayer } from '../../player/redux/actions';

function generateSigningToken(user_id, session_token, callback) {
    jwt.sign({
        user_id: user_id,
        session_token: session_token
    }, config.session.key, { expiresIn: config.session.ttl }, function(err, token) {
        if (err) {
            return callback({
                type: NOTIFICATION_SET,
                subtype: SERVER_TO_CLIENT,
                payload: {
                    type: 'error',
                    message: 'An error occured. Please try again in a moment.'
                }
            });
        }

        callback(null, token);
    });
}

export function login(action, dispatch) {
    const auth_data = action.payload;

    return new Promise((resolve, reject) => {
        request
            .get('https://api.twitch.tv/helix/users')
            .send()
            .set('Authorization', `Bearer ${auth_data.twitch_token}`)
            .set('Client-ID', config.twitch.clientId)
            .set('accept', 'json')
            .end((twitchErr, twitchRes) => {
                if (twitchErr) {
                    return resolve({
                        type: NOTIFICATION_SET,
                        subtype: SERVER_TO_CLIENT,
                        payload: {
                            type: 'error',
                            message: 'Invalid authentication request'
                        }
                    });
                }

                const twitchData = JSON.parse(twitchRes.text).data[0];

                Account.findOne({ twitch_id: escape(twitchData.id) }, { _id: 1, session_token: 1 }, function (err, user) {
                    if (err) {
                        return reject({
                            type: NOTIFICATION_SET,
                            subtype: SERVER_TO_CLIENT,
                            payload: {
                                type: 'error',
                                message: 'Internal server error',
                            }
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
                                type: NOTIFICATION_SET,
                                subtype: SERVER_TO_CLIENT,
                                payload: {
                                    type: 'error',
                                    message: 'Internal server error'
                                }
                            });
                        }

                        Character.loadFromDb(user._id, function(error, character) {
                            if (error) {
                                return resolve(error);
                            }

                            // If a character already is created, just login the player
                            if (character) {
                                return generateSigningToken(user._id, user.session_token, (error, token) => {
                                    if (error) {
                                        return reject(error);
                                    }

                                    // Add plyer to online list
                                    dispatch(addOnlinePlayer({
                                        user_id: user._id,
                                        name: character.name
                                    }))

                                    return resolve({
                                        type: AUTH_LOGIN_SUCCESS,
                                        subtype: SERVER_TO_CLIENT,
                                        payload: {
                                            user_id: user._id,
                                            token: token,
                                            name: character.name,
                                            profile_image: twitchData.profile_image_url
                                        },
                                    });
                                });
                            }

                            if (!auth_data.character_name) {
                                return resolve({
                                    type: PROMPT_CREATE_CHARACTER,
                                    subtype: SERVER_TO_CLIENT,
                                    payload: {}
                                });
                            }

                            Character.createNew(user._id, auth_data.character_name, function(error, character) {
                                if (error) {
                                    return resolve(error);
                                }

                                return generateSigningToken(user._id, user.session_token, (error, token) => {
                                    if (error) {
                                        return reject(error);
                                    }

                                    // Add plyer to online list
                                    dispatch(addOnlinePlayer({
                                        user_id: user._id,
                                        name: character.name
                                    }))

                                    resolve({
                                        type: AUTH_LOGIN_SUCCESS,
                                        subtype: SERVER_TO_CLIENT,
                                        payload: {
                                            user_id: user._id,
                                            token: token,
                                            name: character.name,
                                            profile_image: twitchData.profile_image_url
                                        },
                                    });
                                });
                            })
                        })
                    });
                });
            });
    });
}