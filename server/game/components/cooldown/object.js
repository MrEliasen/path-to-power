import uuid from 'uuid/v4';

/**
 * Cooldown Object class
 */
export default class Cooldown {
    /**
     * Class constructor
     * @param  {String} action    The cooldown key
     * @param  {Number} duration  How long the cooldown is
     * @param  {Bool}   autostart Whether the timer starts when the object is created
     */
    constructor(action, duration, autostart) {
        // create a new unique identifier
        this.id = uuid();
        // The action which is on cooldown (unique key/id per skill/action/etc)
        this.action = action;
        // not used directly, but merely for informative purposes.
        this.duration = duration;
        // number of ticks the cooldown lasts
        this.ticks = (1000 * duration) / 100;
        // hold the tick interval
        this.timer = null;
        // whether the cooldown is waiting for the GC to clean up
        this.remove = false;

        if (autostart) {
            this.start();
        }
    }

    /**
     * Starts the cooldown timer
     */
    start() {
        if (this.timer !== null) {
            return;
        }

        this.timer = setInterval(() => {
            this.ticks--;

            if (this.ticks === 0) {
                this.remove = true;
                clearInterval(this.timer);
            }
        }, 100);
    }
}
