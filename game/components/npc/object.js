import Character from '../character/object';
import uuid from 'uuid/v4';

export default class NPC extends Character {
    constructor(Game, npcData, npcId) {
        super(Game, npcData);
        // bind the NPC template ID
        this.npc_id = npcId;
        // generate a new unique ID for the NPCs
        this.id = uuid();
        // Whether to ignore quantities on items, like ammo, so they dont run out of ammo etc.
        this.ignoreQuantity = true;
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
     * Attck the current active target
     * @return {Promise}
     */
    attack() {
        this.hasActiveTarget()
            .then(() => {
                console.log(`Attacking ${this.target.name}`);
            })
            .catch(() => {});
    }

    /**
     * Whether the NPC has a target and is currently in combat
     * @return {Boolean}
     */
    hasActiveTarget() {
        return new Promise((resolve, reject) => {
            let hasTarget = false;

            // check if the NPC is already engaged in combat
            if (this.target) {
                if (this.target.location.map === this.location.map && this.target.location.x === this.location.x && this.target.location.y === this.location.y) {
                    hasTarget = true;
                }
            }

            if (!hasTarget) {
                if (this.targetedBy.length) {
                    this.setTarget(Math.round(Math.random() * (this.targetedBy.length - 1)));
                    hasTarget = true;
                }
            }

            if (hasTarget) {
                resolve();
            } else {
                reject();
            }
        });
    }

    /**
     * Adds the user id to the gridlock array
     * @param  {Character Obj} character  the character objest of the character gridlocking the character.
     */
    gridLock(character) {
        Character.prototype.gridLock.call(this, character);
        // Make the NPC hostile towards the player, for the duration of its life.
        this.hostiles.push(character);
        // make the NPC immediately aim at the player, if they are not already engaged in combat with another
        this.hasActiveTarget()
            .then(() => {})
            .catch(() => {
                // set the attacker as the target, if there is no current target
                this.setTarget(character);
            })
    }
}