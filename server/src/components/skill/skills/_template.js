/**
 * Hide skill logic
 */
export default class SkillTemplate {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'skillId';
        this.name = 'Skill Name';
        this.description = 'An overall description of the skill itself. ';
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
                description: 'Skill level 1 description',
            },
            {
                tier: 2,
                expCost: 2000,
                description: 'Skill level 2 description',
            },
            {
                tier: 3,
                expCost: 5000,
                description: 'Skill level 3 description',
            },
        ];
    }

    /**
     * The use logic for the skill
     */
    use() {
        
    }
}
