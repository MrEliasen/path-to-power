import Character from '../character/object';
import uuid from 'uuid/v4';

export default class NPC extends Character {
    constructor(Game, npcData, npcId) {
        super(Game, npcData);
        // bind the NPC template ID
        this.npc_id = npcId;
        // generate a new unique ID for the NPCs
        this.id = uuid();
        // keeps track of the timers for the NPC
        this.timers = [];
        // Set the default timers, overwrite with NPC specific timers (in seconds)
        this.timerIntervals = Object.assign({
            "move": 60,
            "attack": 2,
            "resupply": 1200
        }, this.timerIntervals);

        // start the NPC logic
        this.initTimers();
    }

    /**
     * Starts the NPC logic timers
     */
    initTimers() {
        Object.keys(this.timerIntervals).forEach((timerKey) => {
            const method = this[timerKey];

            if (!method) {
                return this.Game.logger.error(`No NPC method found for timer ${timerKey}`);
            }

            this.timers.push(setInterval(method.bind(this), this.timerIntervals[timerKey] * 1000));
        });
    }

    /**
     * Moves the NPC in a random direction
     */
    move() {
        // if the NPC is being targeted, dont move.
        if (this.targetedBy.length) {
            return;
        }

        const moveAction = {
            grid: (Math.floor(Math.random() * 2) ? 'y' : 'x'),
            direction: (Math.floor(Math.random() * 2) ? 1 : -1)
        }

        // set the location we intend to move the NPC to
        let newLocation = {
            ...this.location,
            [moveAction.grid]: this.location[moveAction.grid] + moveAction.direction
        }

        this.Game.mapManager.get(newLocation.map)
            .then((gameMap) => {
                // check if the move action is valid
                if (!gameMap.isValidPostion(newLocation.x, newLocation.y)) {
                    // if not, flip the direction
                    moveAction.direction = (moveAction.direction === 1 ? -1 : 1);
                    // update the new location
                    newLocation = {
                        map: this.location.map,
                        [moveAction.grid]: (this.location[moveAction.grid] + moveAction.direction)
                    }
                }

                // If the new location is out of bounds, just ignore the movement action this time.
                if (!gameMap.isValidPostion(newLocation.x, newLocation.y)) {
                    return;
                }

                // move the NPC
                this.Game.npcManager.move(this, newLocation, moveAction);
            })
            .catch((err) => {
                this.Game.logger.error(err);
            });
    }

    /**
     * Export a plain object of the needed NPC data, to be dispatched to the client.
     * @return {Object} NPC data
     */
    exportToClient() {
        return {
            id: this.id,
            npc_id: this.npc_id,
            name: this.name,
            health: this.stats.health
        }
    }
}