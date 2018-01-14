// Manager specific imports
import {
    ADD_ONLINE_PLAYER,
    REMOVE_ONLINE_PLAYER,
    EQUIP_ITEM,
    UNEQUIP_ITEM,
    UPDATE_CHARACTER,
    MOVE_CHARACTER,
    LEFT_GRID,
    JOINED_GRID
} from './types';
import Character from './object';
import CharacterModel from './model';

export default class CharacterManager {
    constructor(Game) {
        this.Game = Game;
        // keeps track of all current in-game characters
        this.characters = {};
        // keeps track of character locations on the maps
        this.locations = {}
        // log manager progress
        this.Game.logger.debug('CharacterManager::constructor Loaded');
        // listen for dispatches from the socket manager
        this.Game.socketManager.on('dispatch', this.onDispatch.bind(this));
        this.Game.socketManager.on('disconnect', (user) => {
            this.remove(user.user_id);
        })
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
            case MOVE_CHARACTER:
                return this.move(socket, action.payload);
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
                return reject(`Character ${user_id} was not found.`);
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
    async manage(character) {
        // removes disconnect timer, if one is sec (eg if refreshing the page)
        const wasLoggedIn = this.Game.socketManager.clearTimer(character.user_id);

        if (wasLoggedIn && this.characters[character.user_id]) {
            await this.remove(character.user_id, true);
            // re-add targetedBy, if the player has any
            // NOTE: reapply any temporary effects here to avoid relogging to clear them
            this.characters[character.user_id].targetedBy.forEach((user) => {
                character.gridLock(user);
            })
        }

        // add the character object to the managed list of characters
        this.characters[character.user_id] = character;
        this.dispatchUpdatePlayerList(character.user_id, character.name);

        this.Game.socketManager.get(character.user_id).then((socket) => {
            // track the character location
            this.changeLocation(character, character.location);
            // dispatch join event to grid
            this.Game.eventToRoom(character.getLocationId(), 'info', `${character.name} emerges from a nearby building`, [character.user_id]);
            // update the grid's player list
            this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                type: JOINED_GRID,
                payload: {
                    name: character.name,
                    user_id: character.user_id
                }
            });
            // join the grid room
            socket.join(character.getLocationId());
        })
        .catch(this.Game.logger.error);
    }

    /**
     * Remove a managed character from the list
     * @param  {String} user_id User ID
     */
    remove(user_id, reconnect = false) {
        return new Promise((resolve, reject) => {
            this.get(user_id)
                .then((character) => {
                    // dispatch join event to grid
                    this.Game.eventToRoom(character.getLocationId(), 'info', `${character.name} disappears into a nearby building`, [character.user_id]);
                    // remove player from the grid list of players
                    this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: LEFT_GRID,
                        payload: character.user_id
                    });

                    if (!reconnect) {
                        delete this.characters[user_id];
                    }

                    this.dispatchUpdatePlayerList(user_id);
                    resolve();
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    resolve()
                });
        });
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

            this.Game.itemManager.loadInventory(newCharacter)
                .then((items) => {
                    if (items) {
                        items.map((item) => {
                            newCharacter.giveItem(item, item.getAmount());
                        })
                        newCharacter.setInventory(items);
                    }
                    callback(null, newCharacter);
                })
                .catch((error) => this.Game.logger.error(error));
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
        return new Promise((resolve, reject) => {
            this.get(user_id).then((character) => {
                this.Game.logger.debug(`Saving character ${user_id}`);

                // Save the character information (stats/location/etc)
                const saveCharacter = this.dbSave(character);
                const saveInventory = this.Game.itemManager.saveInventory(character);
                Promise.all([saveCharacter, saveInventory]).then((values) => {
                    this.Game.logger.debug(`Saved ${user_id}`, values);
                    resolve();
                });
            });
        });
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

    /**
     * Find a character by their name
     * @param  {Strng} characterName  Name to search for
     * @return {Character Obj}        Character obj if found.
     */
    findByName(targetName) {
        return new Promise((resolve, reject) => {
            targetName = targetName.toLowerCase();

            let found;
            Object.keys(this.characters).map((user_id) => {
                if (this.characters[user_id].name.toLowerCase() === targetName) {
                    found = this.characters[user_id];
                }
            })

            if (!found) {
                return reject('Character not found')
            }

            resolve(found);
        })
    }

    /**
     * Get the list of players at a given location
     * @param  {String} map Map Id
     * @param  {Number} x
     * @param  {Number} y
     * @param  {String} ignore      Ignored a specific user_id, used for returning lists to the user.
     * @param  {Boolean} toClient   Whether to return the references or list of user_ids and names (to be sent to client)
     * @return {Array}     Array of players
     */
    getLocationList(map, x, y, ignore = null, toClient = false) {
        const players = this.locations[`${map}_${y}_${x}`] || [];

        if (!toClient) {
            return players;
        }

        return players
            .filter((obj) => obj.user_id !== ignore)
            .map((character) => {
                return {
                    user_id: character.user_id,
                    name: character.name
                }
            });
    }

    /**
     * Updated the tracked characters location
     * @param  {Character Obj} character   The character reference
     * @param  {Object} oldLocation {map, x, y}
     * @param  {Object} newLocation {map, x ,y}
     */
    changeLocation(character, newLocation = {}, oldLocation = {}) {
        const old_position = this.locations[`${oldLocation.map}_${oldLocation.y}_${oldLocation.x}`];
        const new_position_key = `${newLocation.map}_${newLocation.y}_${newLocation.x}`;

        // if the old location does not exist, we dont need to remove the player from it
        if (old_position) {
            // find index of the play
            const index = old_position.findIndex((char) => char.user_id === character.user_id);

            // and remove the player from the list, if found
            if (index !== -1) {
                old_position.splice(index, 1);
            }
        }

        // if the location array is not set yet, make it
        if (!this.locations[new_position_key]) {
            this.locations[new_position_key] = [];
        }

        // if they are already on the list, ignore.
        if (this.locations[new_position_key].findIndex((char) => char.user_id === character.user_id) !== -1) {
            return;
        }

        this.locations[new_position_key].push(character);
    }

    /**
     * Moves a character to the specific location, emitting related events on the way to and from
     * @param  {Socket.IO Socket} socket    The socket of the character moving
     * @param  {Object} moveAction {grid: 'y|x', direction: 1|-1}
     * @return {Promise}
     */
    move(socket, moveAction) {
        // get the socket character
        this.get(socket.user.user_id).then((character) => {
            let newLocation = {...character.location};
            let directionOut;
            let directionIn;

            // check if character is gridlocked/being targeted by other players
            if (character.targetedBy.length) {
                const list = character.targetedBy.map((obj) => {
                    return obj.name;
                }).join(', ');

                return this.Game.eventToSocket(socket, 'warning', `You can't move as the following players are aiming at you: ${list}`)
            }

            // set the location we intend to move the character to
            newLocation[moveAction.grid] = newLocation[moveAction.grid] + moveAction.direction;

            // make sure the move is valid
            this.Game.mapManager.isValidLocation(newLocation.map, newLocation.x, newLocation.y)
                .then((newLocation) => {
                    // determin the direction names for the JOIN/LEAVE events
                    switch(moveAction.grid) {
                        case 'y':
                            if (moveAction.direction === 1) {
                                directionOut = 'South';
                                directionIn = 'North';
                            } else {
                                directionOut = 'North';
                                directionIn = 'South';
                            }
                            break;
                        case 'x':
                            if (moveAction.direction === 1) {
                                directionOut = 'East';
                                directionIn = 'West';
                            } else {
                                directionOut = 'West';
                                directionIn = 'East';
                            }
                            break;
                    }

                    // remove aim from current target, if set
                    if (character.target) {
                        character.releaseTarget()
                            .then(() => {})
                            .error(Game.logger.error);
                    }

                    // leave the old grid room
                    socket.leave(character.getLocationId());

                    // dispatch leave message to grid
                    this.Game.eventToRoom(character.getLocationId(), 'info', `${character.name} leaves to the ${directionOut}`, [character.user_id])
                    // remove player from the grid list of players
                    this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: LEFT_GRID,
                        payload: character.user_id
                    });

                    // save the old location
                    const oldLocation = {...character.location};

                    // update character location
                    character.updateLocation(newLocation.map, newLocation.x, newLocation.y);
                    
                    // change location on the map
                    this.changeLocation(character, newLocation, oldLocation);

                    // dispatch join message to new grid
                    this.Game.eventToRoom(character.getLocationId(), 'info', `${character.name} strolls in from the ${directionIn}`, [character.user_id]);
                    // add player from the grid list of players
                    this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                        type: JOINED_GRID,
                        payload: {
                            name: character.name,
                            user_id: character.user_id
                        }
                    });

                    // update the socket room
                    socket.join(character.getLocationId());

                    // update client/socket character and location information
                    this.updateClient(character.user_id);

                    // send the new grid details to the client
                    this.Game.mapManager.updateClient(character.user_id);
                })
                .catch(() => {
                    this.Game.logger.debug(`Invalid move by character ${socket.user.user_id}`, newLocation);
                });
        })
        .catch(this.Game.logger.error)
    }
}