import Promise from 'bluebird';

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
import { UPDATE_GROUND_ITEMS } from '../item/types';
import Character from './object';
import CharacterModel from './model';
import characterCommands from './commands';

export default class CharacterManager {
    constructor(Game) {
        this.Game = Game;
        // keeps track of all current in-game characters
        this.characters = [];
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
     * Register all the character commands
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, reject) => {
            // register all the 
            this.Game.commandManager.registerManager(characterCommands);
            resolve();
        });
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
     * Return a player object, matching the name
     * @param  {Strinmg} characterName name or part of name to search for
     * @return {Character Obj}
     */
    getByName(characterName) {
        return new Promise((resolve, reject) =>{
            let character = this.characters.find((obj) => {
                if (obj.name_lowercase === characterName || obj.name_lowercase.indexOf(characterName) === 0) {
                    return true;
                }
            });

            if (!character) {
                return reject();
            }

            resolve(character);
        });
    }

    /**
     * gets the character of the user ID, if one exists
     * @param  {String} user_id User ID
     * @return {Promise}
     */
    get(user_id) {
        return new Promise((resolve, reject) => {
            const character = this.characters.find((obj) => obj.user_id === user_id);

            if (!character) {
                return reject(`Character ${user_id} was not found.`);
            }

            resolve(character);
        })
    }

    /**
     * Dispatches an event to all sockets, adding a player to the playerlist
     * @param  {String} user_id The user ID 
     * @param  {String} name    Name of the character
     */
    dispatchUpdatePlayerList(user_id) {
        // get the player
        this.get(user_id)
            .then((character) => {
                let faction = null;

                // only add faction data if they are in a faction, and it is not disbanded
                if (character.faction && !character.faction.remove) {
                    faction = {
                        tag: character.faction.tag,
                        name: character.faction.name
                    }
                }

                // update the clients online player list
                this.Game.socketManager.dispatchToServer({
                    type: ADD_ONLINE_PLAYER,
                    payload: {
                        user_id: character.user_id,
                        name: character.name,
                        faction: faction
                    }
                });
            });
    }

    /**
     * Dispatches an event to all sockets, removing a player tfrom the playerlist
     * @param  {String} user_id The user ID
     */
    dispatchRemoveFromPlayerList(user_id) {
        // update the clients online player list
        this.Game.socketManager.dispatchToServer({
            type: REMOVE_ONLINE_PLAYER,
            payload: {
                user_id
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
        const existingCharacter = this.characters.find((obj) => obj.user_id === character.user_id);

        if (wasLoggedIn && existingCharacter) {
            await this.remove(character.user_id, true);
            // re-add targetedBy, if the player has any
            // NOTE: reapply any temporary effects here to avoid relogging to clear them
            existingCharacter.targetedBy.forEach((user) => {
                character.gridLock(user);
            });
        }

        // load the character abilities
        await this.Game.abilityManager.load(character);

        // load the character skills
        await this.Game.skillManager.load(character);

        // check if they are in a faction, and load the faction if so
        const faction = await this.Game.factionManager.get(character.faction_id).catch(() => {});

        // if they are in a faction, add them to the online list in the faction, and 
        // add the faction object to the character
        if (faction) {
            faction.linkCharacter(character);
        }

        // add the character object to the managed list of characters
        this.characters.push(character);
        this.dispatchUpdatePlayerList(character.user_id);

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
        .catch(() => {});
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
                        this.characters = this.characters.filter((obj) => obj.user_id !== user_id);
                    }

                    this.dispatchRemoveFromPlayerList(user_id);
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
        this.dbLoad(user_id, async (error, character) => {
            if (error) {
                return callback(error);
            }

            if (!character) {
                return callback(null, null);
            }

            const newCharacter = new Character(this.Game, character.toObject());

            this.manage(newCharacter);

            this.Game.itemManager.loadCharacterInventory(newCharacter)
                .then((items) => {
                    if (items) {
                        newCharacter.setInventory(items);
                        items.map((item, index) => {
                            if (item.equipped_slot) {
                                newCharacter.equip(index);
                            }
                        });
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
        this.characters.forEach((character) => {
            online[character.user_id] = {
                name: character.name,
                user_id: character.user_id,
                faction: character.faction ? {
                    tag: character.faction.tag,
                    name: character.faction.name
                } : null
            }
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
            const total = this.characters.length;
            let saves = 0;

            this.characters.forEach((character) => {
                this.save(character.user_id)
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
            if (!user_id) {
                return reject();
            }

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

    /**
     * Save the character stats, location etc to permanent storage
     * @param  {Character Obj} character The character to save
     * @return {Promise}
     */
    dbSave(character) {
        return new Promise((resolve, reject) => {
            CharacterModel.findOne({ user_id: character.user_id }, (err, dbCharacter) => {
                if (err) {
                    this.Game.logger.error('CharacterManager::dbSave', err);
                    return reject(err);
                }

                // update the character db object, and save the changes
                // NOTE: add any information you want to save here.
                dbCharacter.stats       = {...character.stats};
                dbCharacter.abilities   = character.exportAbilities();
                dbCharacter.skills      = character.exportSkills();
                dbCharacter.location    = {...character.location};
                dbCharacter.faction_id  = character.faction ? character.faction.faction_id : '';

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
     * Find a character in the database, by name
     * @param  {Strng} characterName  Name to search for
     * @return {Object}               Plain object of character.
     */
    dbGetByName(targetName) {
        return new Promise((resolve, reject) => {
            CharacterModel.findOne({ name_lowercase: targetName.toLowerCase() }, function(err, character) {
                if (err) {
                    this.Game.logger.error('CharacterManager::dbGetByName', err);
                    return reject('Internal server error.');
                }

                if (!character) {
                    return reject(null);
                }

                resolve(character.toObject());
            });
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
        let players = this.locations[`${map}_${y}_${x}`] || [];

        if (!toClient) {
            return players;
        }

        return players
            .filter((obj) => obj.user_id !== ignore && !obj.hidden)
            .map((character) => {
                return {
                    user_id: character.user_id,
                    name: character.name
                }
            });
    }

    /**
     * Removes a character from a given map grid
     * @param  {Object} position     The position to remove the player from
     * @param  {Character} character The character to remove
     */
    removeFromGrid(position, character) {
        const playersInGrid = this.locations[`${position.map}_${position.y}_${position.x}`];

        // if the old location does not exist, we dont need to remove the player from it
        if (playersInGrid) {
            // find index of the play
            const index = playersInGrid.findIndex((char) => char.user_id === character.user_id);

            // and remove the player from the list, if found
            if (index !== -1) {
                playersInGrid.splice(index, 1);
            }
        }
    }

    /**
     * Adds a character to the specific map grid
     * @param {Object} position     The location to add the character to
     * @param {Character} character The character to add to the grid
     */
    addToGrid(position, character) {
        const location_key = `${position.map}_${position.y}_${position.x}`;

        // if the location array is not set yet, make it
        if (!this.locations[location_key]) {
            this.locations[location_key] = [];
        }

        // if they are already on the list, ignore.
        if (this.locations[location_key].findIndex((char) => char.user_id === character.user_id) !== -1) {
            return;
        }

        this.locations[location_key].push(character);
    }

    /**
     * Updated the tracked characters location
     * @param  {Character Obj} character   The character reference
     * @param  {Object} oldLocation {map, x, y}
     * @param  {Object} newLocation {map, x ,y}
     */
    changeLocation(character, newLocation = {}, oldLocation = {}) {
        this.removeFromGrid(oldLocation, character);
        this.addToGrid(newLocation, character);
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

            // check if the player is hidden
            if (character.hidden) {
                return this.Game.eventToSocket(socket, 'warning', `You can't move as long as you are hidden. type /unhide to come out of hiding.`);
            }

            const cooldownAction = 'move';
            // check if the character has an existing cooldown from moving
            if (this.Game.cooldownManager.ticksLeft(character, cooldownAction)) {
                return;
            }

            // set the cooldown of the move action
            const newCooldown = this.Game.cooldownManager.add(cooldownAction, 0.3);
            character.cooldowns.push(newCooldown);

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
                    character.releaseTarget().then(() => {
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

                        // start the cooldown timer
                        newCooldown.start();
                    })
                    .error(Game.logger.error);
                })
                .catch(() => {
                    this.Game.logger.debug(`Invalid move by character ${socket.user.user_id}`, newLocation);
                });
        })
        .catch((err) => {
            this.Game.logger.error(err);
        });
    }

    /**
     * Kills a character, drops their loot, and respawns them at the map respawn location
     * @param  {String} user_id   The user ID of the character to kill
     * @param {Character} killer  The character obj of the killer.
     * @return {Promise}
     */
    kill(user_id, killer) {
        return new Promise((resolve, reject) => {
            // fetch the character who got killed
            this.get(user_id).then((character) => {
                // get the map so we know where to respawn the player
                this.Game.mapManager.get(character.location.map).then((gameMap) => {
                    // kill the character
                    character.die().then((droppedLoot) => {
                        // save the old location before it is overwritten by the die() method on the character
                        const oldLocationId = character.getLocationId();
                        // save the old location
                        const oldLocation = {...character.location};
                        // the respawn location
                        const newLocation = {
                            map: gameMap.id,
                            ...gameMap.respawn
                        };

                        // leave the old grid room
                        this.Game.socketManager.userLeaveRoom(character.user_id, character.getLocationId());

                        // remove player from the grid list of players
                        this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                            type: LEFT_GRID,
                            payload: character.user_id
                        });

                        // update character location
                        character.updateLocation(newLocation.map, newLocation.x, newLocation.y);
                        
                        // change location on the map
                        this.changeLocation(character, newLocation, oldLocation);

                        // drop all items on the ground
                        droppedLoot.items.forEach((item) => {
                            this.Game.itemManager.drop(oldLocation.map, oldLocation.x, oldLocation.y, item);
                        });

                        // give the cash to the killer
                        killer.stats.money = killer.stats.money + droppedLoot.cash;

                        // Update the killers character stats
                        this.updateClient(killer.user_id);

                        // Let the killer know how much money they received
                        this.Game.eventToUser(killer.user_id, 'info', `You find ${droppedLoot.cash} money on ${character.name} body.`);

                        // update the client's ground look at the location
                        this.Game.socketManager.dispatchToRoom(oldLocationId, {
                            type: UPDATE_GROUND_ITEMS,
                            payload: this.Game.itemManager.getLocationList(oldLocation.map, oldLocation.x, oldLocation.y, true)
                        })

                        // add player from the grid list of players
                        this.Game.socketManager.dispatchToRoom(character.getLocationId(), {
                            type: JOINED_GRID,
                            payload: {
                                name: character.name,
                                user_id: character.user_id
                            }
                        });

                        // update the socket room
                        this.Game.socketManager.userJoinRoom(character.user_id, character.getLocationId());

                        // update client/socket character and location information
                        this.updateClient(character.user_id);

                        // send the new grid details to the client
                        this.Game.mapManager.updateClient(character.user_id);

                        resolve(oldLocationId);
                    })
                    .catch(reject);
                })
                .catch(reject);
            })
            .catch(reject);
        });
    }
}