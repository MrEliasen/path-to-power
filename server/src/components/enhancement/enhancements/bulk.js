/**
 * Endurance enhancement logic
 */
export default class EnhBulk {
    /**
     * class constructor
     * @param  {Game}   Game      The game object
     * @param  {object} modifiers The skill plain object
     */
    constructor(Game, modifiers = {}) {
        this.Game = Game;
        this.id = 'bulk';
        this.name = 'Bulk';
        this.description = 'Permanently increase number of inventory slots.';
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
        character.stats.inventorySize = this.Game.config.game.defaultstats.inventorySize + enhTier.inventorySizeBonus;
    }

    /**
     * Returns the skill tree with requirements
     */
    getTree() {
        return [
            {
                tier: 1,
                enhPointsCost: 12,
                description: 'Increase your inventory size to 21 slots.',
                inventorySizeBonus: 3,
            },
            {
                tier: 2,
                enhPointsCost: 24,
                description: 'Increase your inventory size to 24 slots.',
                inventorySizeBonus: 6,
            },
            {
                tier: 3,
                enhPointsCost: 48,
                description: 'Increase your inventory size to 27 slots.',
                inventorySizeBonus: 9,
            },
            {
                tier: 4,
                enhPointsCost: 96,
                description: 'Increase your inventory size to 30 slots.',
                inventorySizeBonus: 12,
            },
            {
                tier: 5,
                enhPointsCost: 192,
                description: 'Increase your inventory size to 33 slots.',
                inventorySizeBonus: 15,
            },
            {
                tier: 6,
                enhPointsCost: 384,
                description: 'Increase your inventory size to 36 slots.',
                inventorySizeBonus: 18,
            },
        ];
    }
}
