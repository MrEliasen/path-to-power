export default class AbilityAccuracy {
    constructor(base, value, improve = true) {
        this.id       = 'acc';
        this.name     = 'Accuracy';
        this.base     = base;
        this.improve  = improve;
        this.value    = value || base;
    }

    /**
     * Will make an accuracy check
     * @return {Boolean} True on success
     */
    use() {
        // round to 1 decimal point
        const hit = (Math.round((Math.random() * 100) * 10) / 10) <= this.value;

        // if they hit, increase their accuracy
        if (hit) {
            this.train();
        }

        return hit;
    }

    /**
     * Increase the ability value by the training amount
     */
    train() {
        if (!this.improve) {
            return;
        }

        // this is how much the ability should increment when "used" successfully.
        // By default, it will take 2194 hits to reach 60.0 accuracy.
        // Round the new value to 5 decimal points
        this.value = Math.round(
            Math.round(
                (this.value + (this.base / (200 + (this.value/2) * this.value))) * 100000
            )
        ) / 100000;
    }
}