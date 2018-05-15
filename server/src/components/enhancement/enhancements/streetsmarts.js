/**
 * Endurance enhancement logic
 */
export default class EnhStreetSmarts {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'streetsmarts';
        this.name = 'Street Smarts';
        this.description = 'Allows you to purchase drugs slightly cheaper and sell them slightly more.';
        this.value = 0;

        Object.assign(this, {...modifiers});
    }

    /**
     * Get the skill's modifieres
     * @return {[type]} [description]
     */
    getModifiers() {
        return {
            value: this.value,
        };
    }

    /**
     * Applies the enhancement effect to the buy/sell value.
     * @param {Number} price The price to apply the effect to
     * @param {String} effect The price effect "markup" or "discount"
     */
    applyEffect(price, effect) {
        if (this.value <= 0) {
            return price;
        }

        const enhTier = this.getTree().find((tier) => tier.tier === this.value);

        if (effect === 'discount') {
            price = price * enhTier.discount;
        } else {
            price = price * enhTier.markup;
        }

        return price;
    }

    /**
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                enhPointsCost: 12,
                description: 'Get 2% discount, and sell for 2% more.',
                discount: 0.98,
                markup: 1.02,
            },
            {
                tier: 2,
                enhPointsCost: 24,
                description: 'Get 4% discount, and sell for 4% more.',
                discount: 0.96,
                markup: 1.04,
            },
            {
                tier: 3,
                enhPointsCost: 48,
                description: 'Get 6% discount, and sell for 6% more.',
                discount: 0.94,
                markup: 1.06,
            },
            {
                tier: 4,
                enhPointsCost: 96,
                description: 'Get 8% discount, and sell for 8% more.',
                discount: 0.92,
                markup: 1.08,
            },
            {
                tier: 5,
                enhPointsCost: 192,
                description: 'Get 10% discount, and sell for 10% more.',
                discount: 0.9,
                markup: 1.1,
            },
        ];
    }
}
