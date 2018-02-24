import request from 'superagent';

// account specific imports
import {
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_ERROR,
    ACCOUNT_AUTHENTICATE_SUCCESS,
    ACCOUNT_AUTHENTICATE_NEW,
    CREATE_CHARACTER,
} from './types';
import AccountModel from './model';
import Levels from '../../data/levels.json';

/**
 * Account manager class
 */
export default class AccountManager {
    /**
     * Class constructor
     * @param  {Game} Game The main game object
     */
    constructor(Game) {
        this.Game = Game;

        // Listen for dispatches from the socket manager
        Game.socketManager.on('dispatch', this.handleDispatch.bind(this));
        // log Manager progress
        this.Game.logger.info('AccountManager::constructor Loaded');
    }

    /**
     * Listen for actions we need to react to, within the manager
     * @param  {Socket.IO Object} socket The client the dispatch was fromt
     * @param  {Object} action Redux action object
     */
    handleDispatch(socket, action) {
        switch (action.type) {
            case ACCOUNT_AUTHENTICATE:
                return this.authenticate(socket, action);
            case CREATE_CHARACTER:
                return this.newCharacter(socket, action);
        }

        return null;
    }

    /**
     * handles authentication requests from clients
     * @param  {Socket.IO Object} socket The socket the request from made from
     * @param  {Object} action Redux action object
     */
    authenticate(socket, action) {
        this.Game.logger.debug('AccountManager::authenticate', {
            ...action,
            payload: {
                ...action.payload,
                twitch_token: '<redacted from log>',
            },
        });

        if (!action.payload.twitch_token) {
            return;
        }

        this.dbLogin(action, async (error, account) => {
            if (error) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: error,
                });
            }

            const user_id = account.user_id.toString();

            try {
                // logout any other session(s) if found
                await this.Game.socketManager.logoutOutSession(user_id);
            } catch (err) {
                this.Game.onError(err, socket);
            }

            // add the authenticated use to the socket object
            socket.user = {
                ...account,
                user_id: user_id,
            };

            // add the socket to the list of active clients
            this.Game.socketManager.add(socket);
            this.loadAccount(socket);
        });
    }

    /**
     * Load account data for an authenticated socket/user.
     * @param  {Socket.io Socket} socket The authenticated socket
     */
    loadAccount(socket) {
        // attempt to load the character from the database
        this.Game.characterManager.load(socket.user, (err, character) => {
            if (error) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: error,
                });
            }

            // game data we will send to the client, with the autentication success
            const gameData = this.getGameData();

            // If they do not have a character yet, send them to the character creation screen
            if (!character) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_NEW,
                    payload: {
                        routeTo: '/character',
                        gameData: {
                            maps: gameData.maps,
                        },
                    },
                });
            }

            // Update the client
            this.Game.mapManager.updateClient(character.user_id);

            // get the list of online players (after we loaded the character to make sure it is included)
            gameData.players = this.Game.characterManager.getOnline();

            this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_SUCCESS,
                payload: {
                    character: character.exportToClient(),
                    gameData,
                },
            });

            this.Game.sendMotdToSocket(socket);
        });
    }

    /**
     * Compiles an object containing all relevant game data for the client
     * @return {[type]} [description]
     */
    getGameData() {
        // game data we will send to the client, with the autentication success
        return {
            maps: this.Game.mapManager.getList(),
            items: this.Game.itemManager.getTemplates(),
            players: [],
            commands: this.Game.commandManager.getList(),
            levels: Levels,
        };
    }

    /**
     * handles character creation requests from clients
     * @param  {Socket.IO Object} socket The socket the request from made from
     * @param  {Object}           action Redux action object
     */
    newCharacter(socket, action) {
        if (!action.payload.location) {
            return this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_ERROR,
                payload: {
                    message: 'You must select a start location.',
                },
            });
        }

        // make sure the client is authenticated
        if (!socket.user || !socket.user.user_id) {
            return this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_ERROR,
                payload: {
                    routeTo: '/',
                },
            });
        }

        // make sure we have all the details we need to create the character
        // check we have the starting location
        let gameMap;

        try {
            gameMap = this.Game.mapManager.get(action.payload.location);
        } catch (err) {
            return this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_ERROR,
                payload: {
                    message: 'Invalid start location.',
                },
            });
        }

        // create a new character
        this.Game.characterManager.create(socket.user, gameMap.id, (error, newCharacter) => {
            if (error) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: {
                        'message': 'Something went wrong while creating your character! Sorry, please try again in a moment.',
                    },
                });
            }

            // Update the client
            this.Game.mapManager.updateClient(newCharacter.user_id);

            this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_SUCCESS,
                payload: {
                    character: newCharacter.exportToClient(),
                    gameData: {
                        ...this.getGameData(),
                        players: this.Game.characterManager.getOnline(),
                    },
                },
            });
        });
    }

    /**
     * Creates a new account for a given twitch user
     * @param  {String}   twitch_id    Twitch account ID
     * @param  {String}   display_name Twitch Username
     * @param  {Function} callback
     * @return {ObjectId}              MongoDB objectID (_id) of user
     */
    dbSignup(twitch_id, display_name, callback) {
        const user = new AccountModel({
            twitch_id: twitch_id,
            display_name,
        });

        user.save((err) => {
            if (err) {
                this.Game.logger.error('AccountManager::dbSignup', err);
                return callback({
                    type: 'error',
                    message: 'Internal server error',
                });
            }

            callback(null, user._id);
        });
    }

    /**
     * Database Method, attempts to authenticate the user, by twitch token
     * @param  {Object}   action   Redux action object from the client
     * @param  {Function} callback Returns 2 params, error and account
     */
    dbLogin(action, callback) {
        request.get('https://api.twitch.tv/helix/users')
        .send()
        .set('Authorization', `Bearer ${action.payload.twitch_token}`)
        .set('Client-ID', this.Game.config.twitch.clientId)
        .set('accept', 'json')
        .end((twitchErr, twitchRes) => {
            if (twitchErr) {
                this.Game.logger.error('AccountManager::dbLogin (Request)', twitchErr);
                return callback({
                    type: 'error',
                    message: 'Twitch communication error.',
                });
            }

            const twitchData = JSON.parse(twitchRes.text).data[0];

            AccountModel.findOne({twitch_id: escape(twitchData.id)}, {_id: 1}, (err, user) => {
                if (err) {
                    this.Game.logger.error('AccountManager::dbLogin (Account findOne)', err);
                    return callback({
                        type: 'error',
                        message: 'Internal server error',
                    });
                }

                if (user) {
                    return callback(null, {
                        user_id: user._id,
                        display_name: twitchData.display_name,
                        profile_image: twitchData.profile_image_url,
                    });
                }

                this.dbSignup(twitchData.id, twitchData.display_name, (err, user_id) => {
                    if (err) {
                        this.Game.logger.error('AccountManager::dbLogin (Save)', err);
                        return callback({
                            type: 'error',
                            message: 'Internal server error',
                        });
                    }

                    callback(null, {
                        user_id: user_id,
                        display_name: twitchData.display_name,
                        profile_image: twitchData.profile_image_url,
                    });
                });
            });
        });
    }
}
