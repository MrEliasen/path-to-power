
/**
 * Snoop skill logic
 */
export default class SkillFirstAid {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'firstaid';
        this.name = 'First Aid';
        this.description = 'You can use /firstaid on yourself or target, healing some health.';
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
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                expCost: 1000,
                description: 'First aid heals 5 health. Effect reduced by 80% without a bandage.',
                effects: {
                    health: 5,
                    penalty: 0.2,
                },
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'First aid heals 10 health. Effect reduced by 75% without a bandage.',
                effects: {
                    health: 10,
                    penalty: 0.25,
                },
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'First aid heals 15 health. Effect reduced by 70% without a bandage.',
                effects: {
                    health: 15,
                    penalty: 0.3,
                },
            },
            {
                tier: 4,
                expCost: 10000,
                description: 'First aid heals 20 health. Effect reduced by 65% without a bandage.',
                effects: {
                    health: 20,
                    penalty: 0.35,
                },
            },
        ];
    }

    /**
     * Get information on the target character, based on skill level
     * @param  {Character} targetCharacter Target character
     * @param  {Boolean} hasBandge Whether a bandage is used or not 
     * @return {Object}                    Information from the target character
     */
    use(targetCharacter, hasBandage = false) {
        const tier = this.getTree().find((tier) => tier.tier === this.value);
        let healAmount = tier.effects.health;

        if (!hasBandage) {
            healAmount = Math.round(healAmount * tier.effects.penalty);
        }

        targetCharacter.updateHealth(healAmount);
        return healAmount;
    }
}
