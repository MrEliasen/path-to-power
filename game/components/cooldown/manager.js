import Cooldown from './object';

export default class CooldownManager {
    constructor(Game) {
        this.Game = Game;

        // run the "garbage collection" every N seconds
        this.gc = setInterval(this.cleanup.bind(this), 10000);
    }

    /**
     * Adds a new cooldown to the list
     * @param {String}     action    The unique action/skill identifier
     * @param {Number}     duraction The cooldown duration in seconds
     * @param {character}  character The character object to add the cooldown to.
     * @param {Boolean} autostart Will being the timer when created, instead of manually.
     */
    add(character, action, duraction, autostart = false) {
        // create the new cooldown
        const newCooldown = new Cooldown(action, duraction, autostart);
        // add it to the characters cooldown list cooldowns
        character.cooldowns.push(newCooldown);

        return newCooldown;
    }

    ticksLeft(character, action) {
        const cooldownAction = 'move';
        const cooldown = character.cooldowns.find((cd) => cd.action === action);

        // if there are no timer set, return 0 to aviod locking character from certain actions
        // TODO: Reinitiate timers on server reboot (if any)
        if (!cooldown || !cooldown.timer) {
            return 0;
        }

        if (cooldown.ticks) {
            return Math.max(0, cooldown.ticks);
        }

        return 0;
    }

    /**
     * Removes expired cooldowns
     */
    cleanup() {
        this.Game.characterManager.characters.forEach((character) => {
            character.cooldowns = character.cooldowns.filter((obj) => !obj.remove);
        });
        //this.Game.logger.info(`Cooldown GC removed ${total - this.cooldowns.length} expired cooldowns.`);
    }
}