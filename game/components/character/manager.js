// Manager specific imports
import { ADD_ONLINE_PLAYER, REMOVE_ONLINE_PLAYER, EQUIP_ITEM, UNEQUIP_ITEM, UPDATE_CHARACTER } from './types';
import Character from './object';
import CharacterModel from './model';

export default class CharacterManager {
    constructor(Game) {
        this.Game = Game;
        // keeps track of all current in-game characters
        this.characters = {};

        // log manager progress
        this.Game.logger.debug('CharacterManager::constructor Loaded');

        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
    }

    /**
     * checks for dispatches, and reacts only if the type is listend to
     * @param  {Socket.IO Socket} socket Client who dispatched the action
     * @param  {Object} action The redux action
     */
    onDispatch(socket, action) {
        switch (action.type) {
            case UNEQUIP_ITEM:
                return this.get(socket.user.user_id).then((character) => {
                    character.unEquip(action.payload.slot);
                    this.updateClient(character.user_id);
                });
            case EQUIP_ITEM:
                return this.get(socket.user.user_id).then((character) => {
                    character.equip(action.payload.index);
                    this.updateClient(character.user_id);
                });
        }
    }

    /**
     * Updates the client character information, in part or in full
     * @param  {String} user_id  User Id of client to update
     * @param  {Mixed} property (optional) if only a part of the character needs updating
     */
    updateClient(user_id, property = null) {
        this.get(user_id).then((character) => {
            const characterData = character.exportToClient();

            this.Game.socketManager.dispatchToUser(user_id, {
                type: UPDATE_CHARACTER,
                payload: property ? {[property]: characterData[property]} : characterData
            });
        });
    }

    /**
     * gets the character of the user ID, if one exists
     * @param  {String} user_id User ID
     * @return {Promise}
     */
    get(user_id) {
        return new Promise((resolve, reject) => {
            const character = this.characters[user_id];

            if (!character) {
                return reject();
            }

            resolve(character);
        })
    }

    /**
     * Dispatches an event to all sockets, adding/removing a player to/from the playerlist
     * @param  {String} user_id The user ID 
     * @param  {String} name    Name of the character, leave out to remove from list
     */
    dispatchUpdatePlayerList(user_id, name = null) {
        // update the clients online player list
        this.Game.socketManager.dispatchToServer({
            type: (!name ? REMOVE_ONLINE_PLAYER : ADD_ONLINE_PLAYER),
            payload: {
                user_id,
                name
            }
        })
    }

    /**
     * Adds a character class object to the managed list
     * @param  {Character Obj} character The character object to manage
     */
    manage(character) {
        // add the character object to the managed list of characters
        this.characters[character.user_id] = character;
        this.dispatchUpdatePlayerList(character.user_id, character.name);
    }

    /**
     * Remove a managed character from the list
     * @param  {String} user_id User ID
     */
    remove(user_id) {
        delete this.character[user_id];
        this.dispatchUpdatePlayerList(user_id);
    }

    /**
     * loads a character from the mongodb, based on user_id
     * @param  {String}   user_id  The user ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details.
     */
    load(user_id, callback) {
        this.dbLoad(user_id, (error, character) => {
            if (error) {
                return callback(error);
            }

            if (!character) {
                return callback(null, null);
            }

            const newCharacter = new Character(this.Game, character.toObject());
            this.manage(newCharacter);

            callback(null, newCharacter);
        })
    }

    /**
     * Get the list of all online characterss
     * @return {Object} Object containing user_id => name objects
     */
    getOnline() {
        const online = {};
        Object.keys(this.characters).map((user_id) => {
            online[user_id] = this.characters[user_id].name;
        })

        return online;
    }

    /**
     * database method, attempts to load a character from the database
     * @param  {String}   user_id  User ID who owns the character
     * @param  {Function} callback returns error and character object
     */
    dbLoad(user_id, callback) {
        CharacterModel.findOne({ user_id: user_id }, function(err, character) {
            if (err) {
                this.Game.logger.error('CharacterManager::dbLoad', err);
                return callback({
                    type: 'error',
                    message: 'Internal server error.'
                });
            }

            return callback(null, character);
        });
    }

    /**
     * create a new character
     * @param  {String}   user_id  User ID of the account
     * @param  {String}   name     Character Name
     * @param  {String}   city     Starting city ID
     * @param  {Function} callback Callback function
     * @return {Object}            Object with the character details
     */
    create(user_id, name, city, callback) {
        this.dbCreate(user_id, name, city, (error, character) => {
            if (error) {
                return callback(error)
            }

            const newCharacter = new Character(this.Game, character.toObject());
            this.manage(newCharacter);

            callback(null, newCharacter);
        })
    }

    /**
     * Database method, will attempts to create a new character
     * @param  {String}   user_id        User Id of account
     * @param  {String}   character_name Twitch Name
     * @param  {String}   city           ID of city to start in
     * @param  {Function} callback       Returns an error and character object
     */
    dbCreate(user_id, character_name, city, callback) {
        if (!city || city === '') {
            return callback({
                type: 'warning',
                message: 'You must choose a city.'
            });
        }

        // IDEA: create maps based on country, as players join. Have start in their own country!

        const newCharacter = new CharacterModel({
            user_id: user_id,
            name: character_name,
            location: {
                map: city
            }
        });

        newCharacter.save(function(err) {
            if (err) {
                if (err.code === 11000) {
                    return callback({
                        type: 'warning',
                        message: `That character name is already taken.`
                    });
                }

                this.Game.logger.error('CharacterManager::dbCreate', err);
                return callback({
                    type: 'error',
                    message: 'Internal server error.'
                });
            }

            callback(null, newCharacter);
        });
    }

    /**
     * Save the progress and items of all managed characters
     * @return {Promise}
     */
    saveAll() {
        return new Promise((resolve, reject) => {
            const characters = Object.keys(this.characters);
            const total = characters.length;
            let saves = 0;

            characters.map((user_id) => {
                this.save(user_id)
                    .then(() => {
                        saves++;

                        if (saves === total) {
                            resolve();
                        }
                    })
                    .catch(() => {
                        saves++;

                        if (saves === total) {
                            resolve();
                        }
                    })
            })
        })
    }

    /**
     * Saves a character's (by used id) progress and items
     * @param  {String} user_id The user ID
     * @return {Promise}
     */
    save(user_id) {
        // Save the character information (stats/location/etc)
        const saveCharacter = this.dbSave(this.get(user_id));
        const saveInventory = this.Game.itemManager.saveInventory(character);
        //this.Game.logger.info(`(user_id: ${user_id}) Character save results:`, values);
        return Promise.all([saveInventory, saveCharacter])
    }

    dbSave(character) {
        return new Promise((resolve, reject) => {
            CharacterModel.findOne({ user_id: character.user_id }, (err, dbCharacter) => {
                if (err) {
                    this.Game.logger.error('CharacterManager::dbSave', err);
                    return reject(err);
                }

                // update the character db object, and save the changes
                // NOTE: add any information you want to save here.
                dbCharacter.stats = {...character.stats};
                dbCharacter.location = {...character.location};

                dbCharacter.save((err) => {
                    if (err) {
                        this.Game.logger.error('CharacterManager::dbSave', err);
                        return reject(err);
                    }

                    resolve(dbCharacter);
                });
            });
        })
    }
}