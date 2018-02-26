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
    async authenticate(socket, action) {
        if (!action.payload.twitch_token) {
            return;
        }

        this.dbLogin(action)
            .then(async (account) => {
                if (!account) {
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
                return this.loadAccount(socket);
            })
            .catch((err) => {
                this.Game.onError(err, socket);
            });
    }

    /**
     * Load account data for an authenticated socket/user.
     * @param  {Socket.io Socket} socket The authenticated socket
     */
    async loadAccount(socket) {
        try {
            // attempt to load the character from the database
            const character = await this.Game.characterManager.load(socket.user);

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
        } catch (err) {
            this.Game.onError(err, socket);
        }
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
    async newCharacter(socket, action) {
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

        try {
            // create a new character
            const newCharacter = await this.Game.characterManager.create(socket.user, gameMap.id);

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
        } catch (err) {
            // TODO: Test duplicate accounts
            if (err.code === 11000) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: {
                        message: 'That character name is already taken.',
                    },
                });
            }

            this.Game.onError(err, socket);
        }
    }

    /**
     * Creates a new account for a given twitch user
     * @param  {String}   twitch_id    Twitch account ID
     * @param  {String}   display_name Twitch Username
     * @return {ObjectId}              MongoDB objectID (_id) of user
     */
    async dbSignup(twitch_id, display_name) {
        const user = new AccountModel({
            twitch_id: twitch_id,
            display_name,
        });

        await user.saveAsync();
        return user;
    }

    /**
     * Database Method, attempts to authenticate the user, by twitch token
     * @param  {Object}   action   Redux action object from the client
     */
    dbLogin(action) {
        return new Promise((resolve, reject) => {
            request.get('https://api.twitch.tv/helix/users')
            .send()
            .set('Authorization', `Bearer ${action.payload.twitch_token}`)
            .set('Client-ID', this.Game.config.twitch.clientId)
            .set('accept', 'json')
            .end(async (twitchErr, twitchRes) => {
                if (twitchErr) {
                    return reject('Twitch communication error.');
                }

                try {
                    const twitchData = JSON.parse(twitchRes.text).data[0];
                    let user = await AccountModel.findOneAsync({twitch_id: escape(twitchData.id)}, {_id: 1});

                    // if no account was found, create one.
                    if (!user) {
                        user = await this.dbSignup(twitchData.id, twitchData.display_name);
                    }

                    resolve({
                        user_id: user._id,
                        display_name: twitchData.display_name,
                        profile_image: twitchData.profile_image_url,
                    });
                } catch (err) {
                    reject(err.message);
                }
            });
        });
    }
}
