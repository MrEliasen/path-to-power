import Promise from 'bluebird';
import Character from '../character/object';
import uuid from 'uuid/v4';

/**
 * NPC Object class
 */
export default class NPC extends Character {
    /**
     * class constructor
     * @param  {Game}   Game    The Game object
     * @param  {Object} npcData The plain npc tempalate object
     * @param  {String} npcId   The npc template ID
     */
    constructor(Game, npcData, npcId) {
        super(Game, npcData);
        // bind the NPC template ID
        this.npc_id = npcId;
        // generate a new unique ID for the NPCs
        this.id = uuid();
        // Whether to ignore quantities on items, like ammo, so they dont run out of ammo etc.
        this.ignoreQuantity = true;
        // Whether their skills and abilities should improve when used
        this.train = false;
        // keeps track of the timers for the NPC
        this.timers = [];
        // Anyone who takes aim at the NPC, for the duration of its life, will be
        // added to the list, and attacked on sight.
        this.hostiles = [];
        // Set the default timers, overwrite with NPC specific timers (in seconds)
        this.logic = {
            ...this.logic,
            timers: Object.assign({
                'move': [15, 60],
                'attack': 2,
            }, this.logic.timers),
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
            health: this.stats.health,
        };
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
     * Kills and removes all timers
     */
    async clearTimers() {
        this.timers.forEach((timer) => {
            if (timer.ref) {
                try {
                    if (timer.type === 'timeout') {
                        clearTimeout(timer.ref);
                    } else {
                        clearInterval(timer.ref);
                    }
                } catch (err) {
                    // supress errors caused by clearing a timer/interval
                    // which is no longer active.
                }
            }
        });

        this.timers = [];
        return;
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
                    type: 'timeout',
                    range: [...timerValue],
                    method: method.bind(this),
                    ref: null,
                };
                // add to the managed timer list
                this.timers.push(timer);
                // create the initial timer
                this.updateTimer(timer.key);
            } else {
                this.timers.push({
                    key: timerKey,
                    type: 'interval',
                    ref: setInterval(method.bind(this), timerValue * 1000),
                });
            }
        });
    }

    /**
     * Updates the specific timer, creating a new one with the same params, but randomised timer (if set)
     * @param  {String} timerKey The action/skill/etc the timer governs
     */
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

        this.hasActiveTarget().then(() => {
            // do not move, as they are attacking someone
        })
        .catch(() => {
            const moveAction = {
                grid: (Math.floor(Math.random() * 2) ? 'y' : 'x'),
                direction: (Math.floor(Math.random() * 2) ? 1 : -1),
            };

            // set the location we intend to move the NPC to
            let newLocation = {
                ...this.location,
                [moveAction.grid]: this.location[moveAction.grid] + moveAction.direction,
            };

            this.Game.mapManager.get(newLocation.map)
                .then((gameMap) => {
                    // check if the move action is valid
                    if (!gameMap.isValidPostion(newLocation.x, newLocation.y)) {
                        // if not, flip the direction
                        moveAction.direction = (moveAction.direction === 1 ? -1 : 1);
                        // update the new location
                        newLocation = {
                            map: this.location.map,
                            [moveAction.grid]: (this.location[moveAction.grid] + moveAction.direction),
                        };
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
        });
    }

    /**
     * Sets the target of the character, or NPC, and gridlocks the target (while clearing gridlock on previous target)
     * @param {String} user_id The user_id of their new target
     */
    setTarget(user_id) {
        // release the gridlock of the current target, if set
        this.releaseTarget().then(() => {
            this.Game.characterManager.get(user_id).then((target) => {
                // set the new target
                this.target = target;
                // and gridlock them
                this.target.gridLock(this);
                // let the target know they are aimed at.
                this.Game.eventToUser(target.user_id, 'warning', `${this.name} the ${this.type} has taken aim at you. The only way get out of this, is to kill ${this.name} or /flee <n|s|w|e>`);
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    /**
     * Whether the NPC has a target and is currently in combat
     * @return {Boolean}
     */
    hasActiveTarget() {
        return new Promise((resolve, reject) => {
            let newTarget;

            // check if the NPC has an active target
            if (this.target) {
                if (this.target.location.map === this.location.map && this.target.location.x === this.location.x && this.target.location.y === this.location.y) {
                    return resolve();
                } else {
                    // clear the target, as its no longer in the same spot.
                    this.target = null;
                }
            }

            // if it has no target, check if we have any nearby who are hostile
            if (!this.target) {
                // check if its currently being aimed at, and prioritise those targets
                if (this.targetedBy.length) {
                    newTarget = this.targetedBy[Math.max(0, Math.round((Math.random() * this.targetedBy.length) - 1))];
                    this.setTarget(newTarget.user_id);
                    return resolve();
                }

                // if there are no one currently aiming at them, check for hostiles
                if (this.hostiles.length) {
                    const targets = this.hostiles.filter((obj) => {
                        return obj.location.map === this.location.map && obj.location.x === this.location.x && obj.location.y === this.location.y;
                    });

                    if (targets.length) {
                        newTarget = targets[Math.max(0, Math.round((Math.random() * targets.length) - 1))];
                        this.setTarget(newTarget.user_id);
                        return resolve();
                    }
                }
            }

            this.target = null;
            reject();
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
        this.hasActiveTarget();
    }

    /**
     * Kill the character
     */
    kill(killer) {
        return this.Game.npcManager.kill(this, killer);
    }

    /**
     * Kill the NPC, dropping their items and cash
     * @return {Promise}
     */
    die() {
        return new Promise((resolve, reject) => {
            Character.prototype.die.call(this)
                .then(async (loot) => {
                    await this.clearTimers();

                    // Initiates the NPC's respawn timer
                    this.timers.push({
                        key: 'respawn',
                        ref: setTimeout(() => {
                            this.Game.npcManager.reset(this);
                        }, this.logic.respawn * 1000),
                    });

                    loot.exp = this.stats.exp;

                    resolve(loot);
                })
                .catch(() => {
                    reject();
                });
        });
    }

    /**
     * Attck the current active target
     * @return {Promise}
     */
    attack() {
        this.hasActiveTarget().then(() => {
            const ammo = this.getEquippedSync('ammo');
            let weapon = this.getEquippedSync('ranged');

            // if they have a ranged weapon equipped and ammo, used it
            if (weapon && ammo) {
                return this.attackShoot();
            }

            weapon = this.getEquippedSync('melee');

            // if they have a melee weapon equipped, used it
            if (weapon) {
                return this.attackStrike();
            }

            // otherwise, use fists
            this.attackPunch();
        })
        .catch(() => {});
    }

    /**
     * Attacks the current target with their fists
     */
    attackPunch() {
        // check if the attack will hit
        if (!this.attackHit()) {
            // send event to the target
            this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} takes a swing at you, but they miss.`);
            // send event to the bystanders
            return this.Game.eventToRoom(this.getLocationId(), 'info', `You see ${this.name} the ${this.type} take a swing at ${this.target.name}, but missing.`, [target.user_id]);
        }

        // deal damage to the target
        const attack = this.target.dealDamage(2, true);

        // if the target died
        if (!attack.healthLeft) {
            return this.Game.characterManager.kill(this.target.user_id, this)
                .then((oldLocationId) => {
                    // send event to the target
                    this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} punches you, dealing ${attack.damageDealt} damage, killing you.`);
                    // send event to the bystanders
                    this.Game.eventToRoom(oldLocationId, 'info', `You see ${this.name} the ${this.type} kill ${this.target.name} with their fists. ${this.target.name} fall to the ground, dropping everything they carried.`);
                })
                .catch(() => {});
        }

        // update the target client's character inforamtion
        this.Game.characterManager.updateClient(this.target.user_id, 'stats');
        // send event to the target
        this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} punches you, dealing ${attack.damageDealt} damage.`);
        // send event to the bystanders
        this.Game.eventToRoom(this.getLocationId(), 'info', `You see ${this.name} the ${this.type} punch ${this.target.name}.`, [this.target.user_id]);
    }

    /**
     * Attacks the current target with their ranged weapon
     */
    attackShoot() {
        const weapon = this.getEquippedSync('ranged').name;

        // check if the attack will hit
        if (!this.attackHit()) {
            // send event to the target
            this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} shoots their ${weapon} in your direction, but misses the shot.`);
            // send event to the bystanders
            return this.Game.eventToRoom(this.getLocationId(), 'info', `You see ${this.name} the ${this.type} shoots their ${weapon} in ${this.target.name}'s direction, but misses.`, [this.target.user_id]);
        }

        // deal damage to the target
        this.fireRangedWeapon()
            .then((damage) => {
                const attack = this.target.dealDamage(damage, true);

                // if the target died
                if (!attack.healthLeft) {
                    return this.Game.characterManager.kill(this.target.user_id, this)
                        .then((oldLocationId) => {
                            // send event to the target
                            this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} hits you with their ${weapon}, dealing ${attack.damageDealt} damage, killing you.`);
                            // send event to the bystanders
                            this.Game.eventToRoom(oldLocationId, 'info', `You see ${this.name} the ${this.type} kill ${this.target.name} with a ${weapon}. ${this.target.name} fall to the ground, dropping everything they carried.`);
                        })
                        .catch(() => {});
                }

                // update the target client's character inforamtion
                this.Game.characterManager.updateClient(this.target.user_id, 'stats');
                // send event to the target
                this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} shoots you with a ${weapon}, dealing ${attack.damageDealt} damage.`);
                // send event to the bystanders
                this.Game.eventToRoom(character.getLocationId(), 'info', `You see ${this.name} the ${this.type} shoot ${this.target.name} with a ${weapon}.`, [this.target.user_id]);
            })
            .catch(() => {});
    }

    /**
     * Attacks the current target with their melee weapon
     */
    attackStrike() {
        const weapon = this.getEquippedSync('melee').name;

        // check if the attack will hit
        if (!this.attackHit()) {
            // send event to the target
            this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} swings their ${weapon} at you, but they miss.`);
            // send event to the bystanders
            return this.Game.eventToRoom(this.getLocationId(), 'info', `You see ${this.name} the ${this.type} swing their ${weapon} at ${this.target.name}, but missing.`, [this.target.user_id]);
        }

        this.getWeaponDamage('melee')
            .then((damage) => {
                // deal damage to the target
                const attack = this.target.dealDamage(damage, true);

                // if the target died
                if (!attack.healthLeft) {
                    return this.Game.characterManager.kill(this.target.user_id, this)
                        .then((oldLocationId) => {
                            // send event to the target
                            this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} strikes you with their ${weapon}, dealing ${attack.damageDealt} damage, killing you.`);
                            // send event to the bystanders
                            this.Game.eventToRoom(oldLocationId, 'info', `You see ${this.name} the ${this.type} kill ${this.target.name} with a ${weapon}. ${this.target.name} fall to the ground, dropping everything they carried.`);
                        })
                        .catch(() => {});
                }

                // update the target client's character inforamtion
                this.Game.characterManager.updateClient(this.target.user_id, 'stats');
                // send event to the target
                this.Game.eventToUser(this.target.user_id, 'info', `${this.name} the ${this.type} strikes you with a ${weapon}, dealing ${attack.damageDealt} damage.`);
                // send event to the bystanders
                this.Game.eventToRoom(this.getLocationId(), 'info', `You see ${this.name} the ${this.type} strike ${this.target.name} with a ${weapon}.`, [this.target.user_id]);
            })
            .catch(() => {

            });
    }
}
