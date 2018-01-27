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
        // Anyone who takes aim at the NPC, for the duration of its life, will be 
        // added to the list, and attacked on sight.
        this.hostiles = [];
        // Set the default timers, overwrite with NPC specific timers (in seconds)
        this.logic = {
            ...this.logic, 
            timers: Object.assign({
                "move": [15,60],
                "attack": 2
            }, this.logic.timers)
        };
        // start the NPC logic
        this.initTimers();
    }

    /**
     * Generates a number between the min and max
     * @param  {Number} min
     * @param  {Number} max
     * @return {Number}
     */
    getRandomTimerInterval(min, max) {
        return Math.round(((Math.random() * (max - min)) + min) * 100) / 100;
    }

    /**
     * Starts the NPC logic timers
     */
    initTimers() {
        Object.keys(this.logic.timers).forEach((timerKey) => {
            const method = this[timerKey];
            const timerValue = this.logic.timers[timerKey];

            if (!method) {
                return this.Game.logger.error(`No NPC method found for timer ${timerKey}`);
            }

            // if the timer interval is an array, randomise each time, otherwise just create an Interval;
            if (Array.isArray(timerValue)) {
                const timer = {
                    key: timerKey,
                    type: "interval",
                    range: [...timerValue],
                    method: method.bind(this),
                    ref: null
                };
                // add to the managed timer list
                this.timers.push(timer);
                // create the initial timer
                this.updateTimer(timer.key);
            } else {
                this.timers.push({
                    key: timerKey,
                    type: "interval",
                    ref: setInterval(method.bind(this), timerValue * 1000)
                });
            }
        });
    }

    updateTimer(timerKey) {
        const timer = this.timers.find((obj) => obj.key === timerKey);
        const nextAction = this.getRandomTimerInterval(...timer.range);

        timer.ref = setTimeout(() => {
            timer.method();
            this.updateTimer(timerKey);
        }, nextAction * 1000);
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
            type: this.type,
            health: this.stats.health
        }
    }
}