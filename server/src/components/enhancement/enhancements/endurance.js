/**
 * Endurance enhancement logic
 */
export default class EnhEndurance {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'endurance';
        this.name = 'Endurance';
        this.description = 'Permanently increase your max-health.';
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
     * Applies the enhancement effect to the character object.
     * @param {Character} character The character obj to apply the enhancement effect to
     */
    applyEffect(character) {
        if (this.value <= 0) {
            return;
        }

        const enhTier = this.getTree().find((tier) => tier.tier === this.value);
        const newHealthMax = character.stats.base_health + enhTier.maxHealthBonus;

        // if the character is at full health, set the health to the new max health
        if (character.stats.health === character.stats.health_max) {
            character.stats.health = newHealthMax;
        }

        character.stats.health_max = newHealthMax;
    }

    /**
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                enhPointsCost: 12,
                description: 'Increases your max health to 120',
                maxHealthBonus: 20,
            },
            {
                tier: 2,
                enhPointsCost: 24,
                description: 'Increases your max health to 140',
                maxHealthBonus: 40,
            },
            {
                tier: 3,
                enhPointsCost: 48,
                description: 'Increases your max health to 160',
                maxHealthBonus: 60,
            },
            {
                tier: 4,
                enhPointsCost: 96,
                description: 'Increases your max health to 180',
                maxHealthBonus: 80,
            },
            {
                tier: 5,
                enhPointsCost: 192,
                description: 'Increases your max health to 200',
                maxHealthBonus: 100,
            },
        ];
    }
}
