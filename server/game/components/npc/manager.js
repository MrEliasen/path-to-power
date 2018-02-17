import Promise from 'bluebird';
import NPC from './object';
import NPCList from '../../data/npcs.json';
import {NPC_JOINED_GRID, NPC_LEFT_GRID, UPDATE_GRID_NPCS} from './types';
import {UPDATE_GROUND_ITEMS} from '../item/types';
import namesList from '../../data/names.json';
import {deepCopyObject} from '../../helper';

/**
 * NPC Manager
 */
export default class NPCManager {
    /**
     * class constructor
     * @param  {Game} Game The Game object
     */
    constructor(Game) {
        this.Game = Game;
        // list of managed NPCs in the game
        this.npcs = [];
        // log manager progress
        this.Game.logger.debug('NPCManager::constructor Loaded');
        // keeps track of character locations on the maps
        this.locations = {};
    }

    /**
     * gets the NPC with the specific id
     * @param  {String} npcId The NPC ID
     * @return {Promise}
     */
    get(npcId) {
        return new Promise((resolve, reject) => {
            const NPC = this.npcs.find((obj) => obj.id === npcId);

            if (!NPC) {
                return reject(`NPC ${npcId} was not found.`);
            }

            resolve(NPC);
        });
    }

    /**
     * Adds a NPC class object to the managed list
     * @param {Object} npcData The needed NPC data to create a new npc
     */
    async create(npcData, map, dispatchEvents = true) {
        // make sure the NPC exists
        if (!NPCList[npcData.id]) {
            return this.Game.logger.error(`No NPC with the ID ${npcData.id} exists.`);
        }

        // get the NPC template
        const npcTemplate = deepCopyObject(NPCList[npcData.id]);

        // generate location is one of not set
        npcTemplate.location = npcData.location;

        if (!npcTemplate.location) {
            npcTemplate.location = {
                x: Math.round(Math.random() * map.gridSize.x),
                y: Math.round(Math.random() * map.gridSize.y),
            };
        }

        // add the map id to the location
        npcTemplate.location.map = map.id;

        // randomise gender, and pick a name
        npcTemplate.gender = Math.round(Math.random() * 1) ? 'male' : 'female';
        npcTemplate.name = namesList[npcTemplate.gender][Math.round(Math.random() * (namesList[npcTemplate.gender].length - 1))];

        const newNPC = new NPC(this.Game, npcTemplate, npcData.id);

        // load the character abilities
        await this.Game.abilityManager.load(newNPC);

        // load the character skills
        await this.Game.skillManager.load(newNPC);

        // load shops is available
        if (npcTemplate.shop) {
            newNPC.shop = await this.Game.shopManager.add(npcTemplate.shop);
        }

        await new Promise((resolve) => {
            this.Game.itemManager.loadNPCInventory(newNPC)
            .then((items) => {
                if (items.length) {
                    newNPC.setInventory(items);

                    items.map((item, index) => {
                        if (item.equipped_slot) {
                            newNPC.equip(index);
                        }
                    });
                }

                // add the NPC to the managed list of npcs
                this.npcs.push(newNPC);

                // track the NPC location
                this.changeLocation(newNPC, newNPC.location);

                if (dispatchEvents) {
                    // dispatch join event to grid
                    this.Game.eventToRoom(newNPC.getLocationId(), 'info', `${newNPC.name} emerges from a nearby sidewalk.`);

                    // update the grid's player list
                    this.Game.socketManager.dispatchToRoom(newNPC.getLocationId(), {
                        type: NPC_JOINED_GRID,
                        payload: {
                            name: newNPC.name,
                            id: newNPC.id,
                        },
                    });
                }

                resolve();

                //this.Game.logger.info(`NPC generated. Type: "${newNPC.npc_id}"; Map "${newNPC.location.map}; Location "${newNPC.location.y}-${newNPC.location.x}"`);
            })
            .catch((err) => {
                this.Game.logger.info(err);
                resolve();
            });
        });
    }

    /**
     * Resets an NPC back to tempalte defaults (used eg. for respawns)
     * @param  {NPC} NPC  The NPC object to reset
     */
    reset(NPC) {
        this.Game.mapManager.get(NPC.location.map).then((gameMap) => {
            // get the NPC template
            const npcTemplate = deepCopyObject(NPCList[NPC.npc_id]);

            // generate location is one of not set
            NPC.location = npcTemplate.location;

            // reset all hostiles
            NPC.hostiles = [];

            if (!NPC.location) {
                NPC.location = {
                    x: Math.round(Math.random() * gameMap.gridSize.x),
                    y: Math.round(Math.random() * gameMap.gridSize.y),
                };
            }

            // set the default inventory
            NPC.inventory = npcTemplate.inventory;

            // add the map id to the location
            NPC.location.map = gameMap.id;

            // add the map id to the location
            NPC.stats = {...npcTemplate.stats};

            // randomise gender, and pick a name
            NPC.gender = Math.round(Math.random() * 1) ? 'male' : 'female';
            NPC.name = namesList[NPC.gender][Math.round(Math.random() * (namesList[NPC.gender].length - 1))];

            this.Game.itemManager.loadNPCInventory(NPC)
                .then((items) => {
                    if (items.length) {
                        NPC.setInventory(items);

                        items.map((item, index) => {
                            if (item.equipped_slot) {
                                NPC.equip(index);
                            }
                        });
                    }

                    // track the NPC location
                    this.changeLocation(NPC, NPC.location);

                    // dispatch join event to grid
                    this.Game.eventToRoom(NPC.getLocationId(), 'info', `${NPC.name} emerges from a nearby sidewalk.`);

                    // reinitiate the timers
                    NPC.initLogicTimers();

                    // update the grid's player list
                    this.Game.socketManager.dispatchToRoom(NPC.getLocationId(), {
                        type: NPC_JOINED_GRID,
                        payload: {
                            name: NPC.name,
                            id: NPC.id,
                        },
                    });

                    this.Game.logger.info(`NPC Reset. Type: "${NPC.npc_id}"; Map "${NPC.location.map}; Location "${NPC.location.y}-${NPC.location.x}"`);
                })
                .catch((err) => {});
        })
        .catch(() => {});
    }

    /**
     * Remove a managed NPC from the list
     * @param  {String} npcId The NPC's ID
     */
    remove(npcId) {
        return new Promise((resolve, reject) => {
            this.get(npcId)
                .then((NPC) => {
                    // remove npc from the grid list of npcs
                    this.Game.socketManager.dispatchToRoom(NPC.getLocationId(), {
                        type: NP_LEFT_GRID,
                        payload: NPC.id,
                    });

                    this.npcs = this.npcs.filter((obj) => obj.id !== npcId);
                    resolve();
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    resolve();
                });
        });
    }

    /**
     * Get the list of NPCs at a given location
     * @param  {String}  map        Map Id
     * @param  {Number}  x          Leave out x and y to get the map list.
     * @param  {Number}  y          Leave out x and y to get the map list.
     * @param  {Boolean} toClient   Whether to return the references or list of NPC ID and names (to be sent to client)
     * @return {Array}              Array of NPCs
     */
    getLocationList(map, x = null, y = null, toClient = false) {
        let npcs = [];

        // if we need to get NPCs from a specific grid within a map
        if (x !== null && y !== null) {
            npcs = this.npcs.filter((obj) => obj.location.map === map && obj.location.x === x && obj.location.y === y);
        } else {
            npcs = this.npcs.filter((obj) => obj.location.map === map);
        }

        if (!toClient) {
            return npcs;
        }

        return npcs.map((npc) => {
            return npc.exportToClient();
        });
    }

    /**
     * Removes a NPC from a given map grid
     * @param  {Object} position   The position to remove the npc from
     * @param  {NPC}    NPC        The NPC to remove
     */
    removeFromGrid(position, NPC) {
        const gridId = `${position.y}_${position.x}`;

        // if the old location does not exist, we dont need to remove the player from it
        if (this.locations[position.map] && this.locations[position.map][gridId]) {
            this.locations[position.map][gridId] = this.locations[position.map][gridId].filter((obj) => obj.id !== NPC.id);
        }
    }

    /**
     * Adds a NPC to the specific map grid
     * @param {Object} position   The location to add the NPC to
     * @param {NPC}    NPC        The NPC to add to the grid
     */
    addToGrid(position, NPC) {
        const gridId = `${position.y}_${position.x}`;

        // if the location array is not set yet, make it
        if (!this.locations[position.map][gridId]) {
            this.locations[position.map][gridId] = [];
        }

        // if they are already on the list, ignore.
        if (this.locations[position.map][gridId].findIndex((obj) => obj.id === NPC.id) !== -1) {
            return;
        }

        this.locations[position.map][gridId].push(NPC);
    }

    /**
     * Updated the tracked NPCs location
     * @param  {NPC}    NPC         The NPC
     * @param  {Object} oldLocation {map, x, y}
     * @param  {Object} newLocation {map, x ,y}
     */
    changeLocation(NPC, newLocation = {}, oldLocation = {}) {
        //this.removeFromGrid(oldLocation, NPC);
        //this.addToGrid(newLocation, NPC);
    }

    /**
     * Updates the client map location information
     * @param  {String} locationId  Grid Location Id to update
     */
    updateGrid(location, locationId) {
        // dispatch to client
        this.Game.socketManager.dispatchToRoom(locationId, {
            type: UPDATE_GRID_NPCS,
            payload: this.getLocationList(location.map, location.x, location.y, true),
        });
    }

    /**
     * Moves a NPC to the specific location, emitting related events on the way to and from
     * @param  {NPC}    NPC         The NPC to move
     * @param  {Object} newLocation {map, x, y}
     * @param  {Object} moveAction  {grid, direction}
     * @return {Promise}
     */
    move(NPC, newLocation, moveAction) {
        let directionIn;
        let directionOut;

        // determin the direction names for the JOIN/LEAVE events
        switch (moveAction.grid) {
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

        // dispatch leave message to grid
        this.Game.eventToRoom(NPC.getLocationId(), 'info', `${NPC.name} the ${NPC.type}, moves on to the ${directionOut}`);

        // remove player from the grid list of players
        this.Game.socketManager.dispatchToRoom(NPC.getLocationId(), {
            type: NPC_LEFT_GRID,
            payload: NPC.id,
        });

        // save the old location
        //const oldLocation = {...NPC.location};

        // update character location
        NPC.updateLocation(newLocation.map, newLocation.x, newLocation.y);

        // change location on the map
        //this.changeLocation(NPC, newLocation, oldLocation);

        // dispatch join message to new grid
        this.Game.eventToRoom(NPC.getLocationId(), 'info', `${NPC.name} the ${NPC.type}, moves in from the ${directionIn}`);

        // add player from the grid list of players
        this.Game.socketManager.dispatchToRoom(NPC.getLocationId(), {
            type: NPC_JOINED_GRID,
            payload: NPC.exportToClient(),
        });

        this.Game.logger.debug(`NPC ${NPC.npc_id} (${NPC.id}) moved to ${NPC.location.map} ${NPC.location.y}-${NPC.location.x}`);
    }

    /**
     * Kills a NPC, drops their loot, and start the respawn timer.
     * @param  {String}    npcId   The user ID of the character to kill
     * @param  {Character} killer  The character obj of the killer.
     * @return {Promise}
     */
    kill(NPC, killer) {
        return new Promise((resolve, reject) => {
            // get the map so we know where to respawn the player
            this.Game.mapManager.get(NPC.location.map).then((gameMap) => {
                // kill the NPC
                NPC.die().then((droppedLoot) => {
                    // save the old location before it is overwritten by the die() method on the character
                    const oldLocationId = NPC.getLocationId();
                    // save the old location
                    const oldLocation = {...NPC.location};

                    // remove player from the grid list of players
                    this.Game.socketManager.dispatchToRoom(NPC.getLocationId(), {
                        type: NPC_LEFT_GRID,
                        payload: NPC.id,
                    });

                    // Hide the NPC
                    //this.removeFromGrid(NPC.location, NPC);

                    // drop all items on the ground
                    droppedLoot.items.forEach((item) => {
                        this.Game.itemManager.drop(oldLocation.map, oldLocation.x, oldLocation.y, item);
                    });

                    // give the cash to the killer
                    killer.updateCash(droppedLoot.cash);
                    killer.updateExp(droppedLoot.exp);

                    // Update the killers character stats
                    this.Game.characterManager.updateClient(killer.user_id);

                    // Let the killer know how much money they received
                    this.Game.eventToUser(killer.user_id, 'info', `You find ${droppedLoot.cash} money on ${NPC.name} the ${NPC.type}.`);

                    // update the client's ground look at the location
                    this.Game.socketManager.dispatchToRoom(oldLocationId, {
                        type: UPDATE_GROUND_ITEMS,
                        payload: this.Game.itemManager.getLocationList(oldLocation.map, oldLocation.x, oldLocation.y, true),
                    });

                    resolve(oldLocationId);
                })
                .catch(reject);
            })
            .catch(reject);
        });
    }
}
