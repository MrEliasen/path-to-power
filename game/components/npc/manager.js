import NPC from './object';

export default class NPCManager {
    constructor(Game) {
        this.Game = Game;
        // list of managed NPCs in the game
        this.npcs = [];
        // log manager progress
        this.Game.logger.debug('NPCManager::constructor Loaded');
        // keeps track of character locations on the maps
        this.locations = {}
    }

    /**
     * Create and load all the NPCS into the maps
     * @return {Promise}
     */
    init() {
        return new Promise((resolve, reject) => {
            // load in all the NPCS for the maps
            resolve(0);
        });
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
        })
    }

    /**
     * Adds a NPC class object to the managed list
     * @param {Object} npcData The needed NPC data to create a new npc
     */
    async create(npcData) {
        const newNPC = new NPC(npcData);

        // load the character abilities
        await this.Game.abilityManager.load(newNPC);

        // load the character skills
        await this.Game.skillManager.load(newNPC);

        // add the NPC to the managed list of npcs
        this.npcs.push(newNPC);

        // track the NPC location
        this.changeLocation(newNPC, newNPC.location);

        // dispatch join event to grid
        this.Game.eventToRoom(newNPC.getLocationId(), 'info', `${newNPC.name} emerges from a nearby sidewalk.`);

        // update the grid's player list
        this.Game.socketManager.dispatchToRoom(newNPC.getLocationId(), {
            type: NPC_JOINED_GRID,
            payload: {
                name: newNPC.name,
                id: newNPC.id
            }
        });

        return true;
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
                        payload: NPC.id
                    });

                    this.npcs = this.npcs.filter((obj) => obj.id !== npcId);
                    resolve();
                })
                .catch((err) => {
                    this.Game.logger.error(err);
                    resolve()
                });
        });
    }

    /**
     * Get the list of NPCs at a given location
     * @param  {String}  map        Map Id
     * @param  {Number}  x
     * @param  {Number}  y
     * @param  {Boolean} toClient   Whether to return the references or list of NPC ID and names (to be sent to client)
     * @return {Array}              Array of NPCs
     */
    getLocationList(map, x, y, toClient = false) {
        let npcs = this.locations[`${map}_${y}_${x}`] || [];

        if (!toClient) {
            return npcs;
        }

        return npcs.map((npc) => {
            return {
                id: npc.id,
                name: npc.name
            }
        });
    }

    /**
     * Removes a NPC from a given map grid
     * @param  {Object} position   The position to remove the npc from
     * @param  {NPC}    NPC        The NPC to remove
     */
    removeFromGrid(position, NPC) {
        const gridLocationId = `${position.map}_${position.y}_${position.x}`;

        // if the old location does not exist, we dont need to remove the player from it
        if (this.locations[gridLocationId]) {
            this.locations[gridLocationId] = npcsInGrid.filter((obj) => obj.id !== NPC.id);
        }
    }

    /**
     * Adds a NPC to the specific map grid
     * @param {Object} position   The location to add the NPC to
     * @param {NPC}    NPC        The NPC to add to the grid
     */
    addToGrid(position, NPC) {
        const location_key = `${position.map}_${position.y}_${position.x}`;

        // if the location array is not set yet, make it
        if (!this.locations[location_key]) {
            this.locations[location_key] = [];
        }

        // if they are already on the list, ignore.
        if (this.locations[location_key].findIndex((obj) => obj.id === NPC.id) !== -1) {
            return;
        }

        this.locations[location_key].push(NPC);
    }

    /**
     * Updated the tracked NPCs location
     * @param  {NPC}    NPC         The NPC
     * @param  {Object} oldLocation {map, x, y}
     * @param  {Object} newLocation {map, x ,y}
     */
    changeLocation(NPC, newLocation = {}, oldLocation = {}) {
        this.removeFromGrid(oldLocation, NPC);
        this.addToGrid(newLocation, NPC);
    }
}