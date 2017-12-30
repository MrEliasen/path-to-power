import Account from './model';
import Character from '../../player/db/controller';
import request from 'superagent';
import jwt from 'jsonwebtoken';
import config from '../../../../config.json';

import { CLIENT_NEW_CHARACTER, SERVER_TO_CLIENT, CLIENT_NOTIFICATION, CLIENT_AUTH_SUCCESS } from '../../socket/redux/types';
import { addOnlinePlayer } from '../../player/redux/actions';

function generateSigningToken(user_id, session_token, callback) {
    jwt.sign({
        user_id: user_id,
        session_token: session_token
    }, config.session.key, { expiresIn: config.session.ttl }, function(err, token) {
        if (err) {
            return callback({
                type: CLIENT_NOTIFICATION,
                subtype: SERVER_TO_CLIENT,
                socket: socket,
                payload: {
                    type: 'error',
                    message: 'An error occured. Please try again in a moment.'
                }
            });
        }

        callback(null, token);
    });
}

export function login(action, socket) {
    return (dispatch, getState, io) => {
        request.get('https://api.twitch.tv/helix/users')
        .send()
        .set('Authorization', `Bearer ${action.payload.twitch_token}`)
        .set('Client-ID', config.twitch.clientId)
        .set('accept', 'json')
        .end((twitchErr, twitchRes) => {
            if (twitchErr) {
                return dispatch({
                    type: CLIENT_NOTIFICATION,
                    subtype: SERVER_TO_CLIENT,
                    socket: socket,
                    payload: {
                        type: 'error',
                        message: 'Invalid authentication request'
                    }
                });
            }

            const twitchData = JSON.parse(twitchRes.text).data[0];

            Account.findOne({ twitch_id: escape(twitchData.id) }, { _id: 1, session_token: 1 }, function (err, user) {
                if (err) {
                    return dispatch({
                        type: CLIENT_NOTIFICATION,
                        subtype: SERVER_TO_CLIENT,
                        socket: socket,
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
                        return dispatch({
                            type: CLIENT_NOTIFICATION,
                            subtype: SERVER_TO_CLIENT,
                            socket: socket,
                            payload: {
                                type: 'error',
                                message: 'Internal server error'
                            }
                        });
                    }

                    Character.loadFromDb(user._id, function(error, character) {
                        if (error) {
                            return dispatch(error);
                        }

                        // If a character already is created, just login the player
                        if (character) {
                            return generateSigningToken(user._id, user.session_token, (error, token) => {
                                if (error) {
                                    return dispatch(error);
                                }

                                // Add plyer to online list
                                dispatch(addOnlinePlayer({
                                    user_id: user._id,
                                    name: character.name
                                }))

                                return dispatch({
                                    type: CLIENT_AUTH_SUCCESS,
                                    subtype: SERVER_TO_CLIENT,
                                    socket: socket,
                                    payload: {
                                        user_id: user._id,
                                        token: token,
                                        name: character.name,
                                        profile_image: twitchData.profile_image_url
                                    },
                                });
                            });
                        }

                        if (!action.payload.character_name) {
                            return dispatch({
                                type: CLIENT_NEW_CHARACTER,
                                subtype: SERVER_TO_CLIENT,
                                socket: socket,
                                payload: {}
                            });
                        }

                        Character.createNew(user._id, action.payload.character_name, function(error, character) {
                            if (error) {
                                return dispatch(error);
                            }

                            return generateSigningToken(user._id, user.session_token, (error, token) => {
                                if (error) {
                                    return dispatch(error);
                                }

                                // Add plyer to online list
                                dispatch(addOnlinePlayer({
                                    user_id: user._id,
                                    name: character.name
                                }))

                                dispatch({
                                    type: CLIENT_AUTH_SUCCESS,
                                    subtype: SERVER_TO_CLIENT,
                                    socket: socket,
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
    }
}