
/**
 * Snoop skill logic
 */
export default class SkillFirstaid {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'firstaid';
        this.name = 'First Aid';
        this.command = '/firstaid';
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
                description: 'Allows you to use /firstaid on yourself or a target, with a bandage, healing 5 health.',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Inceases healing about by 10 health.',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Inceases healing about by 15 health',
            },
            {
                tier: 4,
                expCost: 10000,
                description: 'Inceases healing about by 20 health',
            },
        ];
    }

    /**
     * Get information on the target character, based on skill level
     * @param  {Character} targetCharacter Target character
     * @return {Object}                    Information from the target character
     */
    use(targetCharacter) {
        let healAmount = 5 * this.value;

        targetCharacter.updateHealth(healAmount);

        return healAmount;
    }
}
