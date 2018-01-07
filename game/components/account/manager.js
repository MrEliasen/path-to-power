import { ACCOUNT_AUTHENTICATE, ACCOUNT_AUTHENTICATE_ERROR, ACCOUNT_AUTHENTICATE_SUCCESS } from './types';
import { login } from './db/controller';

export default class AccountManager {
    constructor(Game) {
        this.Game = Game;

        console.log('AccountManager');

        // Listen for dispatches from the socket manager
        Game.socketManager.on('dispatch', this.handleDispatch.bind(this));
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
    }

    /**
     * handles authentication requests from clients
     * @param  {Socket.IO Object} socket The socket the request from made from
     * @param  {Object} action Redux action object
     */
    authenticate(socket, action) {
        login(action, (error, account) => {
            if (error) {
                return this.Game.socketManager.dispatchToSocket(socket, {
                    type: ACCOUNT_AUTHENTICATE_ERROR,
                    payload: error
                });
            }

            // add the authenticated use to the socket object
            socket.user = account;
            // add the socket to the list of active clients
            this.Game.socketManager.addClient(socket);
            // attempt to load the character from the database
            this.Game.characterManager.load(socket.user.user_id, (error, character) => {
                if (error) {
                    return this.Game.socketManager.dispatchToUser(socket.user.user_id, {
                        type: ACCOUNT_AUTHENTICATE_ERROR,
                        payload: error
                    });
                }

                // If they already have a character, send them the character and authenticate
                if (character) {
                    return this.Game.socketManager.dispatchToUser(socket.user.user_id, {
                        type: ACCOUNT_AUTHENTICATE_SUCCESS,
                        payload: character
                    })
                }

                // create a new character
                this.Game.characterManager.create(socket.user.user_id, socket.user.display_name, 'london', (error, newCharacter) => {
                     if (error) {
                        return this.Game.socketManager.dispatchToUser(socket.user.user_id, {
                            type: ACCOUNT_AUTHENTICATE_ERROR,
                            payload: error
                        });
                    }

                    console.log('emit new character')

                    return this.Game.socketManager.dispatchToUser(socket.user.user_id, {
                        type: ACCOUNT_AUTHENTICATE_SUCCESS,
                        payload: newCharacter
                    })
                });
            })
        })
    }
}