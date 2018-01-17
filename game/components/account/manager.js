import request from 'superagent';

// account specific imports
import { ACCOUNT_AUTHENTICATE, ACCOUNT_AUTHENTICATE_ERROR, ACCOUNT_AUTHENTICATE_SUCCESS } from './types';
import AccountModel from './model';

export default class AccountManager {
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
        this.Game.logger.debug('AccountManager::handleDispatch', action);

        switch (action.type) {
            case ACCOUNT_AUTHENTICATE:
                return this.authenticate(socket, action);
        }
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
                twitch_token: '<redacted from log>'
            }
        });

        this.dbLogin(action, (error, account) => {
            if (error) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: error
                });
            }

            // add the authenticated use to the socket object
            socket.user = account;
            // add the socket to the list of active clients
            this.Game.socketManager.add(socket);

            // game data we will send to the client, with the autentication success
            const gameData = {
                maps: this.Game.mapManager.getList(),
                items: this.Game.itemManager.getTemplates(),
                players: this.Game.characterManager.getOnline(),
                commands: this.Game.commandManager.getList()
            }

            // attempt to load the character from the database
            this.Game.characterManager.load(socket.user.user_id, async (error, character) => {
                if (error) {
                    return this.Game.socketManager.dispatchToSocket(socket, {
                        type: ACCOUNT_AUTHENTICATE_ERROR,
                        payload: error
                    });
                }

                // If they already have a character, send them the character and authenticate
                if (character) {
                    // check if they are in a faction, and load the faction if so
                    const faction = await this.Game.factionManager.get(character.faction_id).catch(() => {});

                    // if they are in a faction, add them to the online list in the faction, and 
                    // add the faction object to the character
                    if (faction) {
                        faction.addMember(character);
                    }

                    // Update the client f
                    this.Game.mapManager.updateClient(character.user_id);

                    return this.Game.socketManager.dispatchToSocket(socket, {
                        type: ACCOUNT_AUTHENTICATE_SUCCESS,
                        payload: {
                            character: character.exportToClient(),
                            gameData
                        }
                    })
                }

                // create a new character
                this.Game.characterManager.create(socket.user.user_id, socket.user.display_name, 'london', (error, newCharacter) => {
                     if (error) {
                        return this.Game.socketManager.dispatchToSocket(socket, {
                            type: ACCOUNT_AUTHENTICATE_ERROR,
                            payload: error
                        });
                    }

                    // Update the client f
                    this.Game.mapManager.updateClient(character.user_id);

                    return this.Game.socketManager.dispatchToSocket(socket, {
                        type: ACCOUNT_AUTHENTICATE_SUCCESS,
                        payload: {
                            character: newCharacter.exportToClient(),
                            gameData
                        }
                    })
                });
            })
        })
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
                    message: 'Twitch communication error.'
                });
            }

            const twitchData = JSON.parse(twitchRes.text).data[0];

            AccountModel.findOne({ twitch_id: escape(twitchData.id) }, { _id: 1 }, function (err, user) {
                if (err) {
                    this.Game.logger.error('AccountManager::dbLogin (Account findOne)', err);
                    return callback({
                        type: 'error',
                        message: 'Internal server error',
                    });
                }

                if (!user) {
                    user = new AccountModel({
                        twitch_id: twitchData.id
                    });
                }

                user.display_name = twitchData.display_name;

                user.save((err) => {
                    if (err) {
                        this.Game.logger.error('AccountManager::dbLogin (Save)', err);
                        return callback({
                            type: 'error',
                            message: 'Internal server error'
                        });
                    }

                    callback(null, {
                        user_id: user._id,
                        display_name: twitchData.display_name,
                        profile_image: twitchData.profile_image_url
                    });
                });
            });
        });
    }
}