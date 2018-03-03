import jwt from 'jsonwebtoken';

// account specific imports
import AccountModel from '../../api/models/account';
import {
    ACCOUNT_AUTHENTICATE,
    ACCOUNT_AUTHENTICATE_ERROR,
    ACCOUNT_AUTHENTICATE_SUCCESS,
} from './types';

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
        }

        return null;
    }

    /**
     * handles authentication requests from clients
     * @param  {Socket.IO Object} socket The socket the request from made from
     * @param  {Object} action Redux action object
     */
    async authenticate(socket, action) {
        if (!action.payload) {
            return;
        }

        jwt.verify(action.payload, this.Game.config.api.signingKey, async (err, decoded) => {
            if (err) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: 'Invalid authentication token. Please try again.',
                });
            }

            let account;
            let user_id;

            try {
                account = await AccountModel.findOneAsync({_id: escape(decoded._id), session_token: escape(decoded.session_token)}, {_id: 1});

                if (!account) {
                    return this.Game.socketManager.dispatchToSocket(socket, {
                        type: ACCOUNT_AUTHENTICATE_ERROR,
                        payload: 'Invalid authentication token. Please try again.',
                    });
                }

                user_id = account._id.toString();
            } catch (err) {
                this.Game.onError(err, socket);
            }

            try {
                // logout any other session(s) if found
                await this.Game.socketManager.logoutOutSession(user_id);
            } catch (err) {
                this.Game.onError(err, socket);
            }

            // add the authenticated use to the socket object
            socket.user = {
                ...account,
                user_id,
            };

            // add the socket to the list of active clients
            this.Game.socketManager.add(socket);

            // fetch the list of available game maps, for the user to selected from, when
            // creating a new character.
            const gameMaps = this.Game.mapManager.getList();

            return this.Game.socketManager.dispatchToSocket(socket, {
                type: ACCOUNT_AUTHENTICATE_SUCCESS,
                payload: {
                    gameData: {
                        maps: Object.keys(gameMaps).map((mapId) => {
                            return {
                                id: mapId,
                                name: gameMaps[mapId].name,
                            };
                        }),
                    },
                },
            });
        });
    }
}
