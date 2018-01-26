import Cooldown from './object';

export default class CooldownManager {
    constructor(Game) {
        this.Game = Game;
    
        // list of cooldowns
        this.cooldowns = [];

        // run the "garbage collection" every N seconds
        this.gc = setInterval(this.cleanup.bind(this), 5000);
    }

    /**
     * Adds a new cooldown to the list
     * @param {String}  action    The unique action/skill identifier
     * @param {Number}  duraction The cooldown duration in seconds
     * @param {Boolean} autostart Will being the timer when created, instead of manually.
     */
    add(action, duraction, autostart = false) {
        // create the new cooldown
        const newCooldown = new Cooldown(action, duraction, autostart);
        // add it to the list of managed cooldowns
        this.cooldowns.push(newCooldown);
        // start cooldown, and return it,
        return newCooldown;
    }

    ticksLeft(character, action) {
        const cooldownAction = 'move';
        const cooldown = character.cooldowns.find((cd) => cd.action === action);

        if (cooldown && cooldown.ticks) {
            return Math.max(0, cooldown.ticks);
        }

        return 0;
    }

    /**
     * Removes expired cooldowns
     */
    cleanup() {
        const total = this.cooldowns.length;
        this.cooldowns = this.cooldowns.filter((cd) => !cd.remove);
        //this.Game.logger.info(`Cooldown GC removed ${total - this.cooldowns.length} expired cooldowns.`);
    }
}